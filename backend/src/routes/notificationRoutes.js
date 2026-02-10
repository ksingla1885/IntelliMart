const express = require('express');
const router = express.Router();
const {
    getNotificationLogs,
    getNotificationStats,
    retryNotification,
    testEmailConfig,
    deleteNotification,
    clearOldNotifications
} = require('../controllers/notificationController');

// Get notification logs
router.get('/logs', getNotificationLogs);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Retry failed notification
router.post('/retry/:notificationId', retryNotification);

// Test email configuration
router.post('/test-email', testEmailConfig);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Clear old notifications
router.delete('/clear/old', clearOldNotifications);

module.exports = router;
