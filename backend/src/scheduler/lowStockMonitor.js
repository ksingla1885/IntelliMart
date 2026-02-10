const cron = require('node-cron');
const prisma = require('../utils/prismaClient');

/**
 * Check for low stock products and send alerts
 */
async function checkLowStockProducts() {
    console.log('🔍 Checking for low stock products...');

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
                    console.log(`✅ Low stock alert sent to ${shop.owner.email}`);
                } else {
                    console.error(`❌ Failed to send low stock alert to ${shop.owner.email}`);
                }
            }
        }

        console.log(`✅ Low stock check completed. Alerts sent: ${totalAlertsSent}`);
        return { success: true, alertsSent: totalAlertsSent };
    } catch (error) {
        console.error('❌ Low stock check failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Manual trigger for low stock check (for testing or manual runs)
 */
async function triggerLowStockCheck(shopId = null) {
    console.log('🔍 Manual low stock check triggered...');

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
                console.log(`✓ No low stock products in ${shop.name}`);
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
    // Check for low stock every day at 9:00 AM
    // Cron format: minute hour day-of-month month day-of-week
    // '0 9 * * *' = At 09:00 every day
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Scheduled low stock check triggered (Daily 9:00 AM)');
        await checkLowStockProducts();
    });

    console.log('✅ Low stock monitoring initialized (Daily at 9:00 AM)');

    // Optional: Run check immediately on server start (for testing)
    // Uncomment the line below to test low stock alerts on server start
    // checkLowStockProducts();
}

module.exports = {
    initializeLowStockMonitoring,
    checkLowStockProducts,
    triggerLowStockCheck
};
