const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

// Create Stock Movement (and update product stock)
router.post('/', authenticateToken, async (req, res) => {
    const {
        productId,
        type,
        quantity,
        batchNumber,
        expiryDate,
        referenceNumber,
        notes
    } = req.body;

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
        return res.status(400).json({ error: 'Invalid movement type' });
    }

    try {
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Create Stock Movement Record
            const movement = await prisma.stockMovement.create({
                data: {
                    productId,
                    type,
                    quantity: parseFloat(quantity),
                    batchNumber,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    referenceNumber,
                    notes,
                    createdBy: req.user.userId
                }
            });

            // 2. Update Product Stock
            const product = await prisma.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error("Product not found");

            let newStock = parseFloat(product.stock);
            const qty = parseFloat(quantity);

            if (type === 'IN') {
                newStock += qty;
            } else if (type === 'OUT') {
                newStock -= qty;
                if (newStock < 0) {
                    // Check if negative stock is allowed? Assuming yes slightly or handled by UI
                    // The prompt asked "Prevent negative stock" but usually mostly for billing.
                    // For manual adjustment, maybe warning? 
                    // Let's prevent it if it drops below 0 strictly for now as per "Prevent negative stock" requirement.
                    throw new Error("Insufficient stock");
                }
            } else if (type === 'ADJUSTMENT') {
                // If adjustment, does quantity mean "set to"? or "add/subtract"?
                // Usually adjustment is a correction (+ or -). 
                // However, often "Stocktake" sets the absolute value.
                // If the UI sends + or -, we treat it as delta.
                // Let's assume the UI sends the *delta* or effectively what needs to change.
                // But typically ADJ is "new stock level".
                // Looking at StockMovementForm, it just asks for "Quantity".
                // If type is ADJUSTMENT, let's assume it replaces stock?
                // Or wait, standard practice: IN (+), OUT (-). ADJUSTMENT usually is +/- delta.
                // Let's treat ADJUSTMENT like a generic delta. But wait, if user counts 50, and system thinks 45.
                // User enters Adjustment: 5? or 50?
                // Let's assume simpler model: IN adds, OUT removes. ADJUSTMENT adds (can be negative).
                if (qty > 0) newStock += qty;
                else newStock += qty; // handle negative adjustments
            }

            await prisma.product.update({
                where: { id: productId },
                data: { stock: newStock }
            });

            return movement;
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Movements (by Product or Shop??)
// Usually we want history for a product.
router.get('/', authenticateToken, async (req, res) => {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'Product ID is required' });

    try {
        const movements = await prisma.stockMovement.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(movements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
