const express = require('express');
const router = express.Router();
const { createAutomaticBackup } = require('../controllers/backupController');
const { checkLowStockAndNotify } = require('../controllers/notificationController');
const cronController = require('../controllers/cronController');
const authenticateToken = require('../middleware/authMiddleware');

const verifyCronSecret = (req, res, next) => {
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['user-agent']?.includes('vercel-cron');

    // For debugging: log the auth attempt (will show up in Vercel Runtime Logs)
    console.log(`Cron Auth Attempt - UA: ${req.headers['user-agent']}, Vercel-Cron Header: ${req.headers['x-vercel-cron']}`);

    // Trust internal Vercel cron calls or validated external secrets
    if (isVercelCron || (cronSecret && cronSecret === process.env.CRON_SECRET)) {
        return next();
    }

    console.error('Cron Auth Failed: Unauthorized access attempt');
    return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid cron secret'
    });
};

// --- External Cron Endpoints ---
// Use .all to support both POST (GitHub) and GET (Vercel)
router.all('/trigger-backup', verifyCronSecret, async (req, res) => {
    try {

        await createAutomaticBackup();
        res.json({
            success: true,
            message: 'Backup triggered successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Backup failed',
            error: error.message
        });
    }
});

router.all('/check-low-stock', verifyCronSecret, async (req, res) => {
    try {

        await checkLowStockAndNotify();
        res.json({
            success: true,
            message: 'Low stock check completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cron low stock check error:', error);
        res.status(500).json({
            success: false,
            message: 'Low stock check failed',
            error: error.message
        });
    }
});

// --- UI Management Endpoints (Requires Auth) ---
router.get('/jobs', authenticateToken, cronController.getAllJobs);
router.post('/jobs/:id/trigger', authenticateToken, cronController.triggerJob);
router.patch('/jobs/:id/toggle', authenticateToken, cronController.toggleJob);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Cron endpoints are healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
