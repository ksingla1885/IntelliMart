const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

// Create Bill
router.post('/', authenticateToken, async (req, res) => {
    const { shopId, customerId, customerName, customerMobile, paymentMode, items } = req.body;
    // items: [{ productId, quantity, price, taxRate }]

    if (!shopId || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing required fields or empty items" });
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            let subTotal = 0;
            let totalTax = 0;
            let grandTotal = 0;
            let totalCgst = 0;
            let totalSgst = 0;
            let totalIgst = 0;

            const billItemsData = [];

            for (const item of items) {
                const product = await prisma.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Product ${item.productId} not found`);
                if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

                // Deduct Stock
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: product.stock - item.quantity }
                });

                // Calculate Totals
                // Assuming price is the base selling price. Tax is on top.
                // Default tax rate 18% (0.18) if not specified in item payload.
                // Implicit assumption: Intra-state trade (CGST + SGST) for local store.
                const taxRate = item.taxRate ? item.taxRate / 100 : 0.18;

                const itemBaseTotal = item.price * item.quantity;
                const itemTax = itemBaseTotal * taxRate;
                const itemTotal = itemBaseTotal + itemTax;

                const cgst = itemTax / 2;
                const sgst = itemTax / 2;
                const igst = 0; // Defaulting to 0 for local store

                subTotal += itemBaseTotal;
                totalTax += itemTax;
                totalCgst += cgst;
                totalSgst += sgst;
                totalIgst += igst;
                grandTotal += itemTotal;

                billItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    taxAmount: itemTax
                });
            }

            // Generate Bill Number
            // Format: BILL-YYYYMMDD-SEQUENCE
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const count = await prisma.bill.count({ where: { shopId } });
            const billNumber = `INV-${shopId.slice(-4).toUpperCase()}-${dateStr}-${String(count + 1).padStart(4, '0')}`;

            console.log('Creating bill with data:', JSON.stringify({
                shopId,
                customerId,
                billNumber,
                total: grandTotal
            }));

            const billData = {
                shopId,
                billNumber,
                customerName,
                customerMobile,
                paymentMode,
                status: 'PAID',
                subTotal,
                taxAmount: totalTax,
                cgst: totalCgst,
                sgst: totalSgst,
                igst: totalIgst,
                grandTotal: grandTotal,
                totalAmount: grandTotal, // Backward compatibility
                items: {
                    create: billItemsData
                }
            };

            if (customerId) {
                billData.customer = { connect: { id: customerId } };
            }

            const bill = await prisma.bill.create({
                data: billData,
                include: { items: true }
            });

            return bill;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel Bill
router.post('/:id/cancel', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const bill = await prisma.bill.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!bill) throw new Error("Bill not found");
            if (bill.status === 'CANCELLED') throw new Error("Bill already cancelled");

            // Restore Stock
            for (const item of bill.items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }

            // Update Bill Status
            const updatedBill = await prisma.bill.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            return updatedBill;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Bills (with search and filtering)
router.get('/', authenticateToken, async (req, res) => {
    const { shopId, search, startDate, endDate, paymentMode } = req.query;

    // Build where clause
    const where = { shopId };

    if (search) {
        where.OR = [
            { billNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerMobile: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (startDate && startDate !== 'undefined') {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
            where.createdAt = { ...where.createdAt, gte: start };
        }
    }

    if (endDate && endDate !== 'undefined') {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
            where.createdAt = { ...where.createdAt, lte: end };
        }
    }

    if (paymentMode && paymentMode !== 'all' && paymentMode !== 'ALL') {
        const modeMap = {
            'cash': 'CASH',
            'card': 'NET_BANKING',
            'mobile': 'UPI',
            'other': 'CASH'
        };
        where.paymentMode = modeMap[paymentMode.toLowerCase()] || paymentMode.toUpperCase();
    }

    try {
        const bills = await prisma.bill.findMany({
            where,
            include: {
                items: {
                    include: { product: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 for performance by default, add pagination later
        });
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Bill details
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const bill = await prisma.bill.findUnique({
            where: { id },
            include: { items: { include: { product: true } } }
        });
        if (!bill) return res.status(404).json({ error: "Bill not found" });
        res.json(bill);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
