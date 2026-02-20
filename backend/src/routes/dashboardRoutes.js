const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getQuickStats
} = require('../controllers/dashboardController');

const authenticateToken = require('../middleware/authMiddleware');

// Get comprehensive dashboard statistics
router.get('/stats', authenticateToken, getDashboardStats);

// Get quick stats for header
router.get('/quick-stats', authenticateToken, getQuickStats);

module.exports = router;
