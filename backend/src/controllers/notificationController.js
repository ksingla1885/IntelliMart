const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');

/**
 * Get notification logs with filtering
 */
async function getNotificationLogs(req, res) {
    const { shopId, type, status, limit = 50, offset = 0 } = req.query;

    try {
        const whereClause = {};

        if (shopId) whereClause.shopId = shopId;
        if (type) whereClause.type = type;
        if (status) whereClause.status = status;

        const [notifications, total] = await Promise.all([
            prisma.notificationLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            prisma.notificationLog.count({ where: whereClause })
        ]);

        res.json({
            success: true,
            notifications,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > parseInt(offset) + parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get notification logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification logs',
            error: error.message
        });
    }
}

/**
 * Get notification statistics
 */
async function getNotificationStats(req, res) {
    const { shopId, startDate, endDate } = req.query;

    try {
        const whereClause = {};

        if (shopId) whereClause.shopId = shopId;
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) whereClause.createdAt.gte = new Date(startDate);
            if (endDate) whereClause.createdAt.lte = new Date(endDate);
        }

        const [
            totalNotifications,
            sentNotifications,
            failedNotifications,
            notificationsByType
        ] = await Promise.all([
            prisma.notificationLog.count({ where: whereClause }),
            prisma.notificationLog.count({
                where: { ...whereClause, status: 'SENT' }
            }),
            prisma.notificationLog.count({
                where: { ...whereClause, status: 'FAILED' }
            }),
            prisma.notificationLog.groupBy({
                by: ['type'],
                where: whereClause,
                _count: true
            })
        ]);

        const successRate = totalNotifications > 0
            ? ((sentNotifications / totalNotifications) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            stats: {
                total: totalNotifications,
                sent: sentNotifications,
                failed: failedNotifications,
                pending: totalNotifications - sentNotifications - failedNotifications,
                successRate: parseFloat(successRate),
                byType: notificationsByType.reduce((acc, item) => {
                    acc[item.type] = item._count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification statistics',
            error: error.message
        });
    }
}

/**
 * Retry failed notification
 */
async function retryNotification(req, res) {
    const { notificationId } = req.params;

    try {
        const notification = await prisma.notificationLog.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.status === 'SENT') {
            return res.status(400).json({
                success: false,
                message: 'Notification already sent'
            });
        }

        // Update status to retrying
        await prisma.notificationLog.update({
            where: { id: notificationId },
            data: { status: 'RETRYING' }
        });

        // Attempt to resend
        const result = await emailService.sendEmail({
            to: notification.recipient,
            subject: notification.subject,
            html: notification.body,
            type: notification.type,
            userId: notification.userId,
            shopId: notification.shopId,
            metadata: notification.metadata ? JSON.parse(notification.metadata) : null
        });

        if (result.success) {
            await prisma.notificationLog.update({
                where: { id: notificationId },
                data: {
                    status: 'SENT',
                    sentAt: new Date(),
                    errorMessage: null
                }
            });

            res.json({
                success: true,
                message: 'Notification resent successfully'
            });
        } else {
            await prisma.notificationLog.update({
                where: { id: notificationId },
                data: {
                    status: 'FAILED',
                    errorMessage: result.error
                }
            });

            res.status(500).json({
                success: false,
                message: 'Failed to resend notification',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Retry notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry notification',
            error: error.message
        });
    }
}

/**
 * Test email configuration
 */
async function testEmailConfig(req, res) {
    const { testEmail } = req.body;

    try {
        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: 'Test email address is required'
            });
        }

        const result = await emailService.sendEmail({
            to: testEmail,
            subject: 'Test Email - MartNexus',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">Email Configuration Test</h2>
          <p>This is a test email from MartNexus.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            Sent at: ${new Date().toLocaleString('en-IN')}
          </p>
        </div>
      `,
            type: 'GENERAL'
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test email configuration',
            error: error.message
        });
    }
}

/**
 * Delete notification log
 */
async function deleteNotification(req, res) {
    const { notificationId } = req.params;

    try {
        await prisma.notificationLog.delete({
            where: { id: notificationId }
        });

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
}

/**
 * Clear old notification logs
 */
async function clearOldNotifications(req, res) {
    const { daysOld = 30 } = req.query;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

        const result = await prisma.notificationLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });

        res.json({
            success: true,
            message: `Deleted ${result.count} old notifications`,
            deletedCount: result.count
        });
    } catch (error) {
        console.error('Clear old notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear old notifications',
            error: error.message
        });
    }
}

module.exports = {
    getNotificationLogs,
    getNotificationStats,
    retryNotification,
    testEmailConfig,
    deleteNotification,
    clearOldNotifications
};
