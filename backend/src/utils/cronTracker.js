const prisma = require('./prismaClient');

/**
 * Utility to track cron job execution and status in the database
 */
const cronTracker = {
    /**
     * Mark a cron job as running
     */
    async start(name, schedule, description = null) {
        try {
            return await prisma.cronJob.upsert({
                where: { name },
                update: {
                    status: 'RUNNING',
                    description: description || undefined,
                    schedule: schedule,
                    lastRun: new Date(),
                    updatedAt: new Date()
                },
                create: {
                    name,
                    description,
                    schedule,
                    status: 'RUNNING',
                    lastRun: new Date()
                }
            });
        } catch (error) {
            console.error(`[CronTracker] Error starting job ${name}:`, error.message);
        }
    },

    /**
     * Mark a cron job as completed successfully
     */
    async complete(name, result = 'Success') {
        try {
            return await prisma.cronJob.update({
                where: { name },
                data: {
                    status: 'IDLE',
                    lastResult: typeof result === 'string' ? result : JSON.stringify(result),
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error(`[CronTracker] Error completing job ${name}:`, error.message);
        }
    },

    /**
     * Mark a cron job as failed
     */
    async fail(name, error) {
        try {
            return await prisma.cronJob.update({
                where: { name },
                data: {
                    status: 'FAILED',
                    lastResult: typeof error === 'string' ? error : (error.message || 'Unknown error'),
                    updatedAt: new Date()
                }
            });
        } catch (e) {
            console.error(`[CronTracker] Error logging failure for job ${name}:`, e.message);
        }
    }
};

module.exports = cronTracker;
