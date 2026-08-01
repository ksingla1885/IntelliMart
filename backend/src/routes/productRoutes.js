const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

const parseNum = (val, fallback = 0) => {
    if (val === undefined || val === null || val === '') return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
};

// Add Product
router.post('/', authenticateToken, async (req, res) => {
    const sPrice = parseNum(req.body.sellingPrice ?? req.body.price, 0);
    const cPrice = parseNum(req.body.costPrice ?? req.body.cost, 0);
    const gRate = parseNum(req.body.gstRate ?? req.body.gst_rate, 0);
    const stockQty = parseNum(req.body.stock, 0);
    const rLevel = parseNum(req.body.reorderLevel ?? req.body.reorder_level, 5);

    try {
        const product = await prisma.product.create({
            data: {
                shopId: req.body.shopId,
                name: req.body.name,
                categoryId: req.body.categoryId ?? req.body.category_id,
                quantityType: req.body.quantityType ?? req.body.quantity_type ?? 'PIECES',
                costPrice: cPrice,
                sellingPrice: sPrice,
                gstRate: gRate,
                stock: stockQty,
                reorderLevel: rLevel,
                sku: req.body.sku,
                barcode: req.body.barcode,
                description: req.body.description,
                isActive: req.body.isActive ?? req.body.is_active ?? true
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get Products by Shop (with optional filtering)
router.get('/', authenticateToken, async (req, res) => {
    const { shopId, search, categoryId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });

    try {
        const whereClause = {
            shopId,
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (categoryId && categoryId !== 'all') {
            whereClause.categoryId = categoryId;
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            include: { category: true },
            orderBy: { name: 'asc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Product
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const sPrice = req.body.sellingPrice !== undefined || req.body.price !== undefined ? parseNum(req.body.sellingPrice ?? req.body.price, 0) : undefined;
    const cPrice = req.body.costPrice !== undefined || req.body.cost !== undefined ? parseNum(req.body.costPrice ?? req.body.cost, 0) : undefined;
    const gRate = req.body.gstRate !== undefined || req.body.gst_rate !== undefined ? parseNum(req.body.gstRate ?? req.body.gst_rate, 0) : undefined;
    const stockQty = req.body.stock !== undefined ? parseNum(req.body.stock, 0) : undefined;
    const rLevel = req.body.reorderLevel !== undefined || req.body.reorder_level !== undefined ? parseNum(req.body.reorderLevel ?? req.body.reorder_level, 5) : undefined;

    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                categoryId: req.body.categoryId ?? req.body.category_id,
                name: req.body.name,
                quantityType: req.body.quantityType ?? req.body.quantity_type,
                costPrice: cPrice,
                sellingPrice: sPrice,
                gstRate: gRate,
                stock: stockQty,
                reorderLevel: rLevel,
                sku: req.body.sku,
                barcode: req.body.barcode,
                description: req.body.description,
                isActive: req.body.isActive ?? req.body.is_active
            }
        });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Product
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get suppliers linked to a product
router.get('/:id/suppliers', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const supplierProducts = await prisma.supplierProduct.findMany({
            where: { productId: id },
            include: { supplier: true }
        });
        res.json(supplierProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Low Stock Products
router.get('/low-stock', authenticateToken, async (req, res) => {
    const { shopId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });

    try {
        const products = await prisma.product.findMany({
            where: {
                shopId,
                isActive: true
            },
            include: { category: true }
        });

        // Filter in JS because Prisma can't compare two columns in 'where'
        const lowStockProducts = products.filter(p => p.stock <= (p.reorderLevel || 5));
        lowStockProducts.sort((a, b) => a.stock - b.stock);

        res.json(lowStockProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

