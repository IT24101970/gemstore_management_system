const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const { protect } = require('../middleware/auth');

// @route   GET /api/orders/my-purchases
// @desc    Get all purchases for logged in buyer
// @access  Private
router.get('/my-purchases', protect, async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user.id })
            .populate('gemId', 'title price')
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching purchase history',
            error: error.message
        });
    }
});

// @route   GET /api/orders/my-sales
// @desc    Get all sales for logged in seller
// @access  Private
router.get('/my-sales', protect, async (req, res) => {
    try {
        const orders = await Order.find({ sellerId: req.user.id })
            .populate('gemId', 'title price')
            .populate('buyerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sales history',
            error: error.message
        });
    }
});

module.exports = router;