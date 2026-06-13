const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

// GET /api/audit-logs
router.get('/', authenticateToken, async (req, res) => {
    // Check role (allow ADMIN, MANAGER, and USER since USER maps to admin in frontend)
    const userRole = (req.user.role || 'USER').toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'USER') {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }

    try {
        const { table_name, action, date_from, date_to } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;

        // Build query filters
        const where = {};
        if (table_name) {
            where.tableName = table_name;
        }
        if (action) {
            where.action = action;
        }
        if (date_from || date_to) {
            where.createdAt = {};
            if (date_from) {
                where.createdAt.gte = new Date(date_from);
            }
            if (date_to) {
                where.createdAt.lte = new Date(date_to);
            }
        }

        // Get total count
        const totalCount = await prisma.auditLog.count({ where });

        // Get paginated logs
        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize
        });

        // Resolve user profiles
        const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
        let userMap = {};
        if (userIds.length > 0) {
            const users = await prisma.user.findMany({
                where: {
                    id: { in: userIds }
                },
                select: {
                    id: true,
                    email: true,
                    name: true
                }
            });
            userMap = users.reduce((acc, user) => {
                acc[user.id] = { email: user.email, name: user.name };
                return acc;
            }, {});
        }

        // Enrich logs with user details
        const enrichedLogs = logs.map(log => ({
            id: log.id,
            user_id: log.userId,
            action: log.action,
            table_name: log.tableName,
            record_id: log.recordId,
            old_data: log.oldData,
            new_data: log.newData,
            changed_fields: log.changedFields,
            created_at: log.createdAt,
            user_email: log.userId ? userMap[log.userId]?.email : null,
            user_name: log.userId ? userMap[log.userId]?.name : null
        }));

        res.json({
            logs: enrichedLogs,
            totalCount
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/audit-logs/tables
router.get('/tables', authenticateToken, async (req, res) => {
    try {
        const uniqueTables = await prisma.auditLog.findMany({
            select: {
                tableName: true
            },
            distinct: ['tableName']
        });
        const tableNames = uniqueTables.map(t => t.tableName).sort();
        res.json(tableNames);
    } catch (error) {
        console.error('Error fetching audit log tables:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
