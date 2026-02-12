const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const prisma = require('../utils/prismaClient');

const router = express.Router();

// Get all customers for a shop
router.get('/', authenticateToken, async (req, res) => {
    const { shopId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });

    try {
        const customers = await prisma.customer.findMany({
            where: { shopId },
            orderBy: { name: 'asc' }
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create customer
router.post('/', authenticateToken, async (req, res) => {
    const { shopId, name, email, phone, address, discountPercentage } = req.body;
    console.log('=== CREATE CUSTOMER REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Discount value:', discountPercentage);
    console.log('Parsed discount:', parseFloat(discountPercentage) || 0);

    if (!shopId || !name) return res.status(400).json({ error: 'Shop ID and Name are required' });

    try {
        const customer = await prisma.customer.create({
            data: {
                shopId,
                name,
                email,
                phone,
                address,
                discountPercentage: parseFloat(discountPercentage) || 0
            }
        });
        console.log('Created customer:', customer);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, discountPercentage } = req.body;
    console.log('=== UPDATE CUSTOMER REQUEST ===');
    console.log('Customer ID:', id);
    console.log('Request body:', req.body);
    console.log('Discount value:', discountPercentage);

    try {
        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : undefined
            }
        });
        console.log('Updated customer:', customer);
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.customer.delete({ where: { id } });
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer pricing
router.get('/:id/pricing', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const pricing = await prisma.customerPricing.findMany({
            where: { customerId: id },
            include: { product: true }
        });
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upsert customer pricing
router.post('/:id/pricing', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { productId, customPrice } = req.body;

    try {
        const pricing = await prisma.customerPricing.upsert({
            where: {
                customerId_productId: {
                    customerId: id,
                    productId
                }
            },
            update: { customPrice: parseFloat(customPrice) },
            create: {
                customerId: id,
                productId,
                customPrice: parseFloat(customPrice)
            }
        });
        res.json(pricing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer history (bills)
router.get('/:id/history', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const bills = await prisma.bill.findMany({
            where: { customerId: id },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
