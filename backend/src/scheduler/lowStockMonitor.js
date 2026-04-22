const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');
const cronTracker = require('../utils/cronTracker');

const LOW_STOCK_CRON_SCHEDULE = '0 9 * * *'; // Every day at 9:00 AM

/**
 * Check for low stock products and send alerts
 */
async function checkLowStockProducts() {
    const jobName = 'Daily Low Stock Check';

    
    await cronTracker.start(jobName, LOW_STOCK_CRON_SCHEDULE, 'Checks inventory levels across all shops and sends alerts to owners for products below reorder levels.');

    try {
        // Get all shops
        const shops = await prisma.shop.findMany({
            include: {
                owner: true,
                products: {
                    where: {
                        isActive: true,
                        stock: {
                            lte: prisma.product.fields.reorderLevel // Stock <= reorderLevel
                        }
                    },
                    include: {
                        category: true
                    }
                }
            }
        });

        let totalAlertsSent = 0;

        for (const shop of shops) {
            if (shop.products.length === 0) continue;

            // Filter products where stock is at or below reorder level
            const lowStockProducts = shop.products.filter(
                product => product.stock <= product.reorderLevel
            );

            if (lowStockProducts.length === 0) continue;

            console.log(`📧 Sending low stock alert for ${shop.name}: ${lowStockProducts.length} products`);

            // Send email to shop owner
            if (shop.owner.email && shop.owner.isVerified) {
                const result = await emailService.sendLowStockAlert(
                    shop.owner.email,
                    shop.name,
                    lowStockProducts
                );

                if (result.success) {
                    totalAlertsSent++;

                } else {
                    console.error(`❌ Failed to send low stock alert to ${shop.owner.email}`);
                }
            }
        }

        const result = `Low stock check completed. Alerts sent: ${totalAlertsSent}`;
        await cronTracker.complete(jobName, result);

        return { success: true, alertsSent: totalAlertsSent };
    } catch (error) {
        console.error(`❌ ${jobName} failed:`, error);
        await cronTracker.fail(jobName, error);
        return { success: false, error: error.message };
    }
}

/**
 * Manual trigger for low stock check (for testing or manual runs)
 */
async function triggerLowStockCheck(shopId = null) {

    // This can also be tracked as a manual run if needed
    try {
        const whereClause = shopId ? { id: shopId } : {};

        const shops = await prisma.shop.findMany({
            where: whereClause,
            include: {
                owner: true,
                products: {
                    where: {
                        isActive: true
                    },
                    include: {
                        category: true
                    }
                }
            }
        });

        let totalAlertsSent = 0;

        for (const shop of shops) {
            const lowStockProducts = shop.products.filter(
                product => product.stock <= product.reorderLevel
            );

            if (lowStockProducts.length === 0) {

                continue;
            }

            if (shop.owner.email && shop.owner.isVerified) {
                const result = await emailService.sendLowStockAlert(
                    shop.owner.email,
                    shop.name,
                    lowStockProducts
                );

                if (result.success) {
                    totalAlertsSent++;
                }
            }
        }

        return {
            success: true,
            message: `Low stock alerts sent: ${totalAlertsSent}`,
            alertsSent: totalAlertsSent
        };
    } catch (error) {
        console.error('Manual low stock check failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Initialize low stock monitoring scheduler
 */
function initializeLowStockMonitoring() {
    // Check for low stock every day
    cron.schedule(LOW_STOCK_CRON_SCHEDULE, async () => {

        await checkLowStockProducts();
    });

    console.log(`✅ Low stock monitoring initialized (Daily at ${LOW_STOCK_CRON_SCHEDULE})`);
}

module.exports = {
    initializeLowStockMonitoring,
    checkLowStockProducts,
    triggerLowStockCheck
};
