const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');
const cronTracker = require('../utils/cronTracker');
const { addDays } = require('date-fns');

const EXPIRY_CHECK_CRON_SCHEDULE = '0 8 * * *'; // Every day at 8:00 AM

/**
 * Check for products nearing expiry and notify owners
 */
async function checkProductExpiries() {
    const jobName = 'Product Expiry Check';

    
    await cronTracker.start(jobName, EXPIRY_CHECK_CRON_SCHEDULE, 'Checks for stock batches expiring in the next 30 days and alerts shop owners.');

    try {
        const thirtyDaysFromNow = addDays(new Date(), 30);

        // Find stock movements with expiry dates in the next 30 days
        // This is a simplified check assuming we want to alert on any batch nearing expiry
        const expiringBatches = await prisma.stockMovement.findMany({
            where: {
                expiryDate: {
                    gt: new Date(),
                    lte: thirtyDaysFromNow
                },
                quantity: {
                    gt: 0
                }
            },
            include: {
                product: {
                    include: {
                        shop: {
                            include: {
                                owner: true
                            }
                        }
                    }
                }
            }
        });

        // Group by shop
        const shopAlerts = {};
        for (const batch of expiringBatches) {
            const shopId = batch.product.shop.id;
            if (!shopAlerts[shopId]) {
                shopAlerts[shopId] = {
                    shop: batch.product.shop,
                    items: []
                };
            }
            shopAlerts[shopId].items.push({
                productName: batch.product.name,
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
            });
        }

        let alertsSent = 0;
        for (const shopId in shopAlerts) {
            const { shop, items } = shopAlerts[shopId];
            


            if (shop.owner.email && shop.owner.isVerified) {
                const result = await emailService.sendExpiryAlert(
                    shop.owner.email,
                    shop.name,
                    items
                );
                if (result.success) alertsSent++;
            }
        }

        const result = `Expiry alerts sent to ${alertsSent} shops. Total expiring items found: ${expiringBatches.length}`;
        await cronTracker.complete(jobName, result);

    } catch (error) {
        console.error(`❌ ${jobName} failed:`, error);
        await cronTracker.fail(jobName, error);
    }
}

/**
 * Initialize expiry check scheduler
 */
function initializeExpiryCheckScheduler() {
    cron.schedule(EXPIRY_CHECK_CRON_SCHEDULE, async () => {

        await checkProductExpiries();
    });

    console.log(`✅ Expiry check scheduler initialized (Daily at ${EXPIRY_CHECK_CRON_SCHEDULE})`);
}

module.exports = {
    initializeExpiryCheckScheduler,
    checkProductExpiries
};
