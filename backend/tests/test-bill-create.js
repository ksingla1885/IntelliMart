const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting...");
        // Fetch a valid shop ID
        const shop = await prisma.shop.findFirst();
        if (!shop) {
            console.log("No shop found, cannot test bill creation.");
            return;
        }
        console.log("Found shop:", shop.id);

        // Fetch a valid product
        const product = await prisma.product.findFirst({ where: { shopId: shop.id } });
        if (!product) {
            console.log("No product found for shop, cannot test bill creation.");
            return;
        }
        console.log("Found product:", product.id);

        // Prepare dummy bill data
        const billData = {
            shopId: shop.id,
            // customerId: undefined, // Test without customer first
            billNumber: "TEST-" + Date.now(),
            customerName: "Test Customer",
            customerMobile: "1234567890",
            paymentMode: "CASH",
            status: "PAID",
            subTotal: 100,
            taxAmount: 18,
            cgst: 9,
            sgst: 9,
            igst: 0,
            grandTotal: 118,
            items: {
                create: [
                    {
                        productId: product.id,
                        quantity: 1,
                        price: 100,
                        taxAmount: 18
                    }
                ]
            }
        };

        console.log("Attempting to create bill WITHOUT customer...");
        const bill = await prisma.bill.create({
            data: billData,
            include: { items: true }
        });
        console.log("Created bill successfully:", bill.id);

        // Now test WITH customer if one exists
        const customer = await prisma.customer.findFirst({ where: { shopId: shop.id } });
        if (customer) {
            console.log("Found customer:", customer.id);
            const billDataWithCustomer = {
                ...billData,
                billNumber: "TEST-CUST-" + Date.now(),
                // Using the relation syntax as updated in the code
                customer: { connect: { id: customer.id } }
            };

            console.log("Attempting to create bill WITH customer...");
            const billWithCust = await prisma.bill.create({
                data: billDataWithCustomer,
                include: { items: true }
            });
            console.log("Created bill with customer successfully:", billWithCust.id);
        } else {
            console.log("No customer found due to empty DB, skipping customer test.");
        }

    } catch (error) {
        console.error("Error creating bill:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
