const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

// Create Shop
router.post('/', authenticateToken, async (req, res) => {
    const { name, address, mobile, gstin } = req.body;
    try {
        const shop = await prisma.shop.create({
            data: {
                name,
                address,
                mobile,
                gstin,
                ownerId: req.user.userId
            }
        });
        res.status(201).json(shop);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get My Shops
router.get('/', authenticateToken, async (req, res) => {
    try {
        const shops = await prisma.shop.findMany({
            where: { ownerId: req.user.userId }
        });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Shop
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, address, mobile, gstin } = req.body;
    try {
        const existingShop = await prisma.shop.findUnique({ where: { id } });
        if (!existingShop) return res.status(404).json({ message: 'Shop not found' });
        if (existingShop.ownerId !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

        const shop = await prisma.shop.update({
            where: { id },
            data: { name, address, mobile, gstin }
        });
        res.json(shop);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Shop
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const existingShop = await prisma.shop.findUnique({ where: { id } });
        if (!existingShop) return res.status(404).json({ message: 'Shop not found' });
        if (existingShop.ownerId !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

        await prisma.shop.delete({ where: { id } });
        res.json({ message: 'Shop deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
