process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const dotenv = require('dotenv');
dotenv.config();

const prisma = require('./utils/prismaClient');
const { subDays, startOfDay, endOfDay } = require('date-fns');

async function run() {
    console.log("Starting DB seeding for user: ketansingla7988@gmail.com...");
    try {
        const userEmail = "ketansingla7988@gmail.com";
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            throw new Error(`User with email ${userEmail} not found in the database. Please register/create this user first.`);
        }

        console.log(`Found user: ${user.email} (ID: ${user.id})`);

        // Check if user already has shops
        const existingShops = await prisma.shop.findMany({
            where: { ownerId: user.id }
        });

        if (existingShops.length > 0) {
            console.log(`User already has ${existingShops.length} shop(s). Cleaning up previous shop data for a clean seed...`);
            for (const shop of existingShops) {
                // Delete dependables
                console.log(`Cleaning up data for shop: ${shop.name} (${shop.id})`);
                
                // Prisma cascade deletes will handle most, but let's delete manually to be safe where not cascaded
                await prisma.billItem.deleteMany({ where: { bill: { shopId: shop.id } } });
                await prisma.bill.deleteMany({ where: { shopId: shop.id } });
                await prisma.stockMovement.deleteMany({ where: { product: { shopId: shop.id } } });
                await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: { shopId: shop.id } } });
                await prisma.purchaseOrder.deleteMany({ where: { shopId: shop.id } });
                await prisma.supplierProduct.deleteMany({ where: { product: { shopId: shop.id } } });
                await prisma.customerPricing.deleteMany({ where: { product: { shopId: shop.id } } });
                await prisma.product.deleteMany({ where: { shopId: shop.id } });
                await prisma.category.deleteMany({ where: { shopId: shop.id } });
                await prisma.customer.deleteMany({ where: { shopId: shop.id } });
                await prisma.supplier.deleteMany({ where: { shopId: shop.id } });
                await prisma.shop.delete({ where: { id: shop.id } });
            }
            console.log("Cleanup finished.");
        }

        // Create new shop
        console.log("Creating new shop: IntelliMart Premium Store...");
        const shop = await prisma.shop.create({
            data: {
                ownerId: user.id,
                name: "IntelliMart Premium Store",
                address: "100 Innovation Way, Suite A, Metro City",
                mobile: "+1 555-987-6543",
                gstin: "27AAAAA1111A1Z1"
            }
        });
        console.log(`Created shop: ${shop.name} (ID: ${shop.id})`);

        // Create Categories
        console.log("Creating categories...");
        const categories = {};
        const categoryNames = ["Electronics", "Home & Living", "Office Supplies", "Groceries"];
        for (const name of categoryNames) {
            const cat = await prisma.category.create({
                data: {
                    shopId: shop.id,
                    name
                }
            });
            categories[name] = cat;
        }
        console.log(`Created ${Object.keys(categories).length} categories.`);

        // Create Suppliers
        console.log("Creating suppliers...");
        const suppliers = [];
        const supplierData = [
            { name: "PrimeTech Distributors", contact_person: "Alice Vance", email: "order@primetech.com", phone: "555-1234", address: "Silicon Valley, CA" },
            { name: "Apex Office Wholesalers", contact_person: "Bruce Wayne", email: "contact@apexwholesalers.com", phone: "555-5678", address: "Gotham City, NY" },
            { name: "Metro Food Group", contact_person: "Catherine Green", email: "sales@metrofood.com", phone: "555-9012", address: "Chicago, IL" }
        ];

        for (const s of supplierData) {
            const supplier = await prisma.supplier.create({
                data: {
                    shopId: shop.id,
                    ...s,
                    is_active: true
                }
            });
            suppliers.push(supplier);
        }
        console.log(`Created ${suppliers.length} suppliers.`);

        // Create Products
        console.log("Creating products...");
        const productsData = [
            // Electronics
            { name: "UltraWide Monitor 34\"", costPrice: 320.00, sellingPrice: 499.99, stock: 12, category: "Electronics", sku: "ELE-MON-34", reorderLevel: 5, quantityType: "PIECES" },
            { name: "Ergonomic Mechanical Keyboard", costPrice: 45.00, sellingPrice: 89.99, stock: 3, category: "Electronics", sku: "ELE-KEY-ERG", reorderLevel: 5, quantityType: "PIECES" }, // low stock
            { name: "USB-C Multi-Port Hub", costPrice: 15.00, sellingPrice: 34.99, stock: 25, category: "Electronics", sku: "ELE-HUB-USBC", reorderLevel: 5, quantityType: "PIECES" },
            { name: "Wireless Noise-Canceling Earbuds", costPrice: 60.00, sellingPrice: 119.99, stock: 4, category: "Electronics", sku: "ELE-EAR-WRL", reorderLevel: 5, quantityType: "PIECES" }, // low stock
            // Home & Living
            { name: "Aromatherapy Essential Oil Diffuser", costPrice: 12.00, sellingPrice: 29.99, stock: 18, category: "Home & Living", sku: "HOM-DIF-ARO", reorderLevel: 3, quantityType: "PIECES" },
            { name: "Stainless Steel Water Flask 1L", costPrice: 8.00, sellingPrice: 19.99, stock: 40, category: "Home & Living", sku: "HOM-FLK-1L", reorderLevel: 5, quantityType: "PIECES" },
            { name: "Smart LED Desk Lamp", costPrice: 20.00, sellingPrice: 45.00, stock: 2, category: "Home & Living", sku: "HOM-LMP-LED", reorderLevel: 3, quantityType: "PIECES" }, // low stock
            // Office Supplies
            { name: "Premium Hardcover Journal", costPrice: 4.00, sellingPrice: 12.50, stock: 60, category: "Office Supplies", sku: "OFF-JRN-PRM", reorderLevel: 10, quantityType: "PIECES" },
            { name: "Fine-Tip Gel Pens (12 Pack)", costPrice: 3.00, sellingPrice: 9.99, stock: 45, category: "Office Supplies", sku: "OFF-PEN-GEL", reorderLevel: 10, quantityType: "PIECES" },
            // Groceries
            { name: "Dark Roast Organic Coffee Beans 1kg", costPrice: 10.00, sellingPrice: 24.50, stock: 80, category: "Groceries", sku: "GRO-COF-DRK", reorderLevel: 10, quantityType: "KG" },
            { name: "Premium Matcha Green Tea Powder", costPrice: 14.00, sellingPrice: 29.99, stock: 35, category: "Groceries", sku: "GRO-MTC-PRM", reorderLevel: 5, quantityType: "PIECES" }
        ];

        const products = [];
        for (const p of productsData) {
            const product = await prisma.product.create({
                data: {
                    shopId: shop.id,
                    name: p.name,
                    costPrice: p.costPrice,
                    sellingPrice: p.sellingPrice,
                    stock: p.stock,
                    sku: p.sku,
                    reorderLevel: p.reorderLevel,
                    quantityType: p.quantityType,
                    categoryId: categories[p.category].id,
                    isActive: true
                }
            });
            products.push(product);

            // Create initial stock movement (IN)
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: "IN",
                    quantity: p.stock + 20, // entered with slightly higher stock then sold down
                    notes: "Initial inventory load"
                }
            });
        }
        console.log(`Created ${products.length} products with initial stock movements.`);

        // Create SupplierProduct associations
        console.log("Associating products with suppliers...");
        for (const p of products) {
            // Assign prime supplier for electronics, apex for office supplies, metro for groceries/home
            let chosenSupplier = suppliers[0]; // primetech
            if (p.sku.startsWith("OFF")) {
                chosenSupplier = suppliers[1]; // apex
            } else if (p.sku.startsWith("GRO") || p.sku.startsWith("HOM")) {
                chosenSupplier = suppliers[2]; // metro
            }

            await prisma.supplierProduct.create({
                data: {
                    supplierId: chosenSupplier.id,
                    productId: p.id,
                    costPrice: p.costPrice,
                    supplierSku: `SUP-${p.sku}`,
                    isPreferred: true
                }
            });
        }

        // Create Customers
        console.log("Creating customers...");
        const customers = [];
        const customerData = [
            { name: "Devin Patel", email: "devin@gmail.com", phone: "9876543001", address: "123 Main St, New York", firmName: "Patel Tech Solutions", gstin: "27AAAAA1111A1Z1" },
            { name: "Elena Rostova", email: "elena@gmail.com", phone: "9876543002", address: "456 Oak Ave, Boston", firmName: "Rostova Trading Co", gstin: "27BBBBB2222B2Z2" },
            { name: "Marcus Aurelius", email: "marcus@rome.org", phone: "9876543003", address: "1 Palace Way, Rome", firmName: "Imperium Goods", gstin: "27CCCCC3333C3Z3" },
            { name: "Priyah Sharma", email: "priyah@outlook.com", phone: "9876543004", address: "789 Lotus Blvd, Mumbai", firmName: "Sharma & Sons", gstin: "27DDDDD4444D4Z4" }
        ];

        for (const c of customerData) {
            const customer = await prisma.customer.create({
                data: {
                    shopId: shop.id,
                    ...c
                }
            });
            customers.push(customer);
        }
        console.log(`Created ${customers.length} customers.`);

        // Helper to find product by SKU
        const getProd = (sku) => products.find(p => p.sku === sku);

        // Seeding Bills historically over the last 30 days
        console.log("Seeding bills historical data (last 30 days)...");
        const billsToCreate = [];

        // Define sales configuration per day relative to today (0 = today, 1 = yesterday, etc.)
        // We will seed multiple transactions for each of the last 30 days to build a rich line chart
        const totalDays = 30;
        let billCounter = 1;

        for (let dayOffset = totalDays - 1; dayOffset >= 0; dayOffset--) {
            const date = subDays(new Date(), dayOffset);
            
            // Random number of transactions on this day (1 to 4)
            const transactionsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 bills per day

            for (let t = 0; t < transactionsCount; t++) {
                // Select a customer randomly or Walk-in (null customerId)
                const isWalkIn = Math.random() > 0.7;
                const customer = isWalkIn ? null : customers[Math.floor(Math.random() * customers.length)];
                
                // Choose payment mode
                const paymentModes = ["CASH", "UPI", "NET_BANKING"];
                const paymentMode = paymentModes[Math.floor(Math.random() * paymentModes.length)];

                // Select 1 to 3 items randomly
                const itemsCount = Math.floor(Math.random() * 3) + 1;
                const selectedProducts = [];
                // Shuffle copy of products
                const shuffled = [...products].sort(() => 0.5 - Math.random());
                
                for (let i = 0; i < itemsCount; i++) {
                    selectedProducts.push(shuffled[i]);
                }

                let subTotal = 0;
                let totalTax = 0;
                const billItems = [];

                for (const p of selectedProducts) {
                    const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
                    const price = parseFloat(p.sellingPrice);
                    const itemBaseTotal = price * quantity;
                    const taxRate = 0.18; // 18% default GST
                    const itemTax = itemBaseTotal * taxRate;
                    
                    subTotal += itemBaseTotal;
                    totalTax += itemTax;

                    billItems.push({
                        productId: p.id,
                        quantity,
                        price,
                        taxAmount: itemTax
                    });
                }

                const grandTotal = subTotal + totalTax;
                const cgst = totalTax / 2;
                const sgst = totalTax / 2;

                const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                const billNumber = `INV-${shop.id.slice(-4).toUpperCase()}-${dateStr}-${String(billCounter++).padStart(4, '0')}`;

                // Set different times of day
                const transactionDate = new Date(date);
                transactionDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0);

                billsToCreate.push({
                    shopId: shop.id,
                    customerId: customer ? customer.id : null,
                    billNumber,
                    customerName: customer ? customer.name : (Math.random() > 0.5 ? "Alex Mercer" : "Jane Doe"),
                    customerMobile: customer ? customer.phone : (Math.random() > 0.5 ? "9999911111" : null),
                    customerFirm: customer ? "Individual" : null,
                    totalAmount: grandTotal,
                    createdAt: transactionDate,
                    updatedAt: transactionDate,
                    cgst,
                    sgst,
                    igst: 0,
                    status: "PAID",
                    subTotal,
                    taxAmount: totalTax,
                    paymentMode,
                    grandTotal,
                    items: billItems
                });
            }
        }

        console.log(`Generated plan for ${billsToCreate.length} bills. Inserting into DB...`);
        
        let insertedBills = 0;
        for (const billData of billsToCreate) {
            const { items, ...mainBill } = billData;
            
            // Create bill
            const createdBill = await prisma.bill.create({
                data: {
                    ...mainBill,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            taxAmount: item.taxAmount
                        }))
                    }
                }
            });

            // Create stock movement (OUT) for each item in the bill
            for (const item of items) {
                await prisma.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: "OUT",
                        quantity: item.quantity,
                        createdAt: billData.createdAt,
                        notes: `Sale - Bill ${createdBill.billNumber}`
                    }
                });
            }

            insertedBills++;
            if (insertedBills % 10 === 0) {
                console.log(`Inserted ${insertedBills}/${billsToCreate.length} bills...`);
            }
        }
        console.log(`Successfully created ${insertedBills} historical bills & stock movements.`);

        // Create a couple of Purchase Orders (one completed, one pending)
        console.log("Seeding Purchase Orders...");
        
        // PO 1: Completed
        const po1Date = subDays(new Date(), 10);
        const po1 = await prisma.purchaseOrder.create({
            data: {
                shopId: shop.id,
                supplier_id: suppliers[0].id, // PrimeTech
                order_date: po1Date,
                expected_delivery_date: subDays(new Date(), 8),
                status: "RECEIVED",
                total_amount: 960.00,
                notes: "Regular stock order of monitors and keyboards",
                createdAt: po1Date,
                updatedAt: po1Date
            }
        });

        const prodMonitor = getProd("ELE-MON-34");
        const prodKeyboard = getProd("ELE-KEY-ERG");

        await prisma.purchaseOrderItem.createMany({
            data: [
                { purchaseOrderId: po1.id, productId: prodMonitor.id, quantity: 2, costPrice: prodMonitor.costPrice },
                { purchaseOrderId: po1.id, productId: prodKeyboard.id, quantity: 7, costPrice: prodKeyboard.costPrice }
            ]
        });

        // Add stock movement for RECEIVED purchase order
        await prisma.stockMovement.createMany({
            data: [
                { productId: prodMonitor.id, type: "IN", quantity: 2, createdAt: subDays(new Date(), 8), notes: `Purchase Order ${po1.id} Received` },
                { productId: prodKeyboard.id, type: "IN", quantity: 7, createdAt: subDays(new Date(), 8), notes: `Purchase Order ${po1.id} Received` }
            ]
        });

        // PO 2: Pending
        const po2Date = subDays(new Date(), 2);
        const po2 = await prisma.purchaseOrder.create({
            data: {
                shopId: shop.id,
                supplier_id: suppliers[1].id, // Apex
                order_date: po2Date,
                expected_delivery_date: subDays(new Date(), -3), // 3 days in future
                status: "ORDERED",
                total_amount: 360.00,
                notes: "Urgent notebook and gel pens restocking",
                createdAt: po2Date,
                updatedAt: po2Date
            }
        });

        const prodJournal = getProd("OFF-JRN-PRM");
        const prodPens = getProd("OFF-PEN-GEL");

        await prisma.purchaseOrderItem.createMany({
            data: [
                { purchaseOrderId: po2.id, productId: prodJournal.id, quantity: 30, costPrice: prodJournal.costPrice },
                { purchaseOrderId: po2.id, productId: prodPens.id, quantity: 80, costPrice: prodPens.costPrice }
            ]
        });

        console.log("Successfully seeded Purchase Orders.");

        console.log("SEEDED DATA OVERVIEW:");
        console.log(`- Shop: ${shop.name} (${shop.id})`);
        console.log(`- Categories: ${categoryNames.join(', ')}`);
        console.log(`- Products: ${products.length} (including 3 low stock items: Mechanical Keyboard, Wireless Earbuds, LED Desk Lamp)`);
        console.log(`- Customers: ${customers.length}`);
        console.log(`- Suppliers: ${suppliers.length}`);
        console.log(`- Bills: ${insertedBills} transactions spread over 30 days`);
        console.log(`- Purchase Orders: 2 (1 RECEIVED, 1 ORDERED)`);
        console.log("DB seeding completed successfully for ketansingla7988@gmail.com!");

    } catch (err) {
        console.error("CRITICAL ERROR IN SEEDER SCRIPT:", err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
