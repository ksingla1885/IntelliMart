const cron = require('node-cron');
const prisma = require('../utils/prismaClient');
const emailService = require('../utils/emailService');
const cronTracker = require('../utils/cronTracker');
const { startOfDay, endOfDay, subDays } = require('date-fns');

const SALES_REPORT_CRON_SCHEDULE = '0 21 * * *'; // Every day at 9:00 PM

/**
 * Generate and send daily sales reports to shop owners
 */
async function generateDailySalesReports() {
    const jobName = 'Daily Sales Report';

    
    await cronTracker.start(jobName, SALES_REPORT_CRON_SCHEDULE, 'Generates a summary of today\'s sales for each shop and emails it to the owner.');

    try {
        const today = new Date();
        const startDate = startOfDay(today);
        const endDate = endOfDay(today);

        // Get all shops
        const shops = await prisma.shop.findMany({
            include: {
                owner: true,
                bills: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        },
                        status: 'PAID'
                    }
                }
            }
        });

        let reportsSent = 0;

        for (const shop of shops) {
            if (shop.bills.length === 0) continue;

            // Calculate totals
            const totalSales = shop.bills.reduce((sum, bill) => sum + Number(bill.grandTotal), 0);
            const totalBills = shop.bills.length;
            const avgBillValue = totalSales / totalBills;



            // Send email to shop owner
            if (shop.owner.email && shop.owner.isVerified) {
                // Assuming emailService has this method, if not we'll need to add it or use a general one
                const result = await emailService.sendDailySalesReport(
                    shop.owner.email,
                    {
                        shopName: shop.name,
                        date: today,
                        totalSales,
                        totalBills,
                        avgBillValue,
                        bills: shop.bills.slice(0, 10) // Send top 10 bills
                    }
                );

                if (result.success) reportsSent++;
            }
        }

        const result = `Daily sales reports sent: ${reportsSent}`;
        await cronTracker.complete(jobName, result);

    } catch (error) {
        console.error(`❌ ${jobName} failed:`, error);
        await cronTracker.fail(jobName, error);
    }
}

/**
 * Initialize daily sales report scheduler
 */
function initializeSalesReportScheduler() {
    cron.schedule(SALES_REPORT_CRON_SCHEDULE, async () => {

        await generateDailySalesReports();
    });

    console.log(`✅ Daily sales report scheduler initialized (Daily at ${SALES_REPORT_CRON_SCHEDULE})`);
}

module.exports = {
    initializeSalesReportScheduler,
    generateDailySalesReports
};
