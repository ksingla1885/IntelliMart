const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');

/**
 * Perform automatic weekly backup
 */
async function performAutomaticBackup() {
    console.log('Starting automatic weekly backup...');

    try {
        // Get all users with verified emails
        const users = await prisma.user.findMany({
            where: { isVerified: true },
            include: {
                shops: true
            }
        });

        for (const user of users) {
            try {
                // Create full database backup for user's shops
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupData = await createFullDatabaseBackup();
                const fileName = `auto-backup-${timestamp}.json`;
                const fileInfo = await saveBackupToFile(backupData, fileName);

                // Create backup record
                await prisma.backup.create({
                    data: {
                        shopId: null,
                        type: 'FULL_DATABASE',
                        fileName: fileInfo.fileName,
                        filePath: fileInfo.filePath,
                        fileSize: fileInfo.fileSize,
                        status: 'COMPLETED',
                        isAutomatic: true,
                        completedAt: new Date()
                    }
                });

                // Send success notification
                await emailService.sendBackupSuccessEmail(user.email, {
                    ...fileInfo,
                    isAutomatic: true,
                    type: 'FULL_DATABASE',
                    createdAt: new Date()
                });

                console.log(`Automatic backup completed for user: ${user.email}`);
            } catch (error) {
                console.error(`Backup failed for user ${user.email}:`, error.message);

                // Create failed backup record
                await prisma.backup.create({
                    data: {
                        shopId: null,
                        type: 'FULL_DATABASE',
                        fileName: 'failed',
                        filePath: 'failed',
                        fileSize: 0,
                        status: 'FAILED',
                        isAutomatic: true,
                        errorMessage: error.message,
                        completedAt: new Date()
                    }
                });

                // Send failure notification
                await emailService.sendBackupFailureEmail(user.email, {
                    error: error.message,
                    isAutomatic: true,
                    type: 'FULL_DATABASE'
                });
            }
        }

        // Cleanup old backups (keep last 10)
        const cleanupResult = await cleanupOldBackups(10);
        console.log(`Cleaned up ${cleanupResult.deleted} old backups`);

        console.log('Automatic weekly backup completed successfully');
    } catch (error) {
        console.error('Automatic backup process failed:', error.message);
    }
}

/**
 * Initialize backup scheduler
 */
function initializeBackupScheduler() {
    // Schedule automatic backup every Sunday at 2:00 AM
    // Cron format: minute hour day-of-month month day-of-week
    // '0 2 * * 0' = At 02:00 on Sunday
    cron.schedule('0 2 * * 0', async () => {
        console.log('Triggered automatic weekly backup (Sunday 2:00 AM)');
        await performAutomaticBackup();
    });

    console.log('✅ Automatic backup scheduler initialized (Every Sunday at 2:00 AM)');

    // Optional: Run backup immediately on server start (for testing)
    // Uncomment the line below to test automatic backup on server start
    // performAutomaticBackup();
}

module.exports = {
    initializeBackupScheduler,
    performAutomaticBackup
};
