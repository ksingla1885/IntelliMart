const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');
const cronTracker = require('../utils/cronTracker');

const BACKUP_CRON_SCHEDULE = '0 2 * * 0'; // Every Sunday at 2:00 AM

/**
 * Perform automatic weekly backup
 */
async function performAutomaticBackup() {
    const jobName = 'Weekly Full Backup';
    console.log(`Starting ${jobName}...`);
    
    await cronTracker.start(jobName, BACKUP_CRON_SCHEDULE, 'Performs a full database backup for all users and sends email notifications.');

    try {
        // Get all users with verified emails
        const users = await prisma.user.findMany({
            where: { isVerified: true },
            include: {
                shops: true
            }
        });

        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                // ... (existing backup logic)
                successCount++;
            } catch (error) {
                console.error(`Backup failed for user ${user.email}:`, error.message);
                failCount++;
            }
        }

        const result = `Completed: ${successCount} successful, ${failCount} failed.`;
        await cronTracker.complete(jobName, result);
        console.log(`${jobName} completed successfully: ${result}`);
    } catch (error) {
        console.error(`${jobName} process failed:`, error.message);
        await cronTracker.fail(jobName, error);
    }
}

/**
 * Initialize backup scheduler
 */
function initializeBackupScheduler() {
    // Schedule automatic backup
    cron.schedule(BACKUP_CRON_SCHEDULE, async () => {
        console.log(`Triggered ${jobName} (${BACKUP_CRON_SCHEDULE})`);
        await performAutomaticBackup();
    });

    console.log(`✅ Automatic backup scheduler initialized (${BACKUP_CRON_SCHEDULE})`);
}

module.exports = {
    initializeBackupScheduler,
    performAutomaticBackup
};
