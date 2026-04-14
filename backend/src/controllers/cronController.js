const prisma = require('../utils/prismaClient');
const { performAutomaticBackup } = require('../scheduler/backupScheduler');
const { checkLowStockProducts } = require('../scheduler/lowStockMonitor');
const { generateDailySalesReports } = require('../scheduler/dailySalesReport');
const { checkProductExpiries } = require('../scheduler/expiryCheck');

/**
 * Controller for managing cron jobs
 */
const cronController = {
    /**
     * Get all cron jobs and their status
     */
    async getAllJobs(req, res) {
        try {
            const jobs = await prisma.cronJob.findMany({
                orderBy: { name: 'asc' }
            });
            res.json({ success: true, jobs });
        } catch (error) {
            console.error('Error fetching cron jobs:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch cron jobs' });
        }
    },

    /**
     * Trigger a specific cron job manually
     */
    async triggerJob(req, res) {
        const { id } = req.params;
        try {
            const job = await prisma.cronJob.findUnique({ where: { id } });
            
            if (!job) {
                return res.status(404).json({ success: false, message: 'Job not found' });
            }

            // Trigger the job asynchronously
            res.json({ success: true, message: `Job '${job.name}' triggered successfully` });

            // Execution logic
            switch (job.name) {
                case 'Weekly Full Backup':
                    await performAutomaticBackup();
                    break;
                case 'Daily Low Stock Check':
                    await checkLowStockProducts();
                    break;
                case 'Daily Sales Report':
                    await generateDailySalesReports();
                    break;
                case 'Product Expiry Check':
                    await checkProductExpiries();
                    break;
                default:
                    console.warn(`No execution logic defined for job: ${job.name}`);
            }
        } catch (error) {
            console.error('Error triggering job:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Failed to trigger job' });
            }
        }
    },

    /**
     * Toggle job active status
     */
    async toggleJob(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        try {
            const job = await prisma.cronJob.update({
                where: { id },
                data: { isActive }
            });
            res.json({ success: true, job });
        } catch (error) {
            console.error('Error toggling job:', error);
            res.status(500).json({ success: false, message: 'Failed to update job status' });
        }
    }
};

module.exports = cronController;
