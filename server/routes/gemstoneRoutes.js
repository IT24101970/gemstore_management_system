const express = require('express');
const router = express.Router();
const { Gemstone, User } = require('../models');

// @route   GET /api/gemstones
// @desc    Get all gemstones (featured)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const gemstones = await Gemstone.find({
            status: 'available',
            approvalStatus: 'approved'
        })
            .populate('sellerId', 'name email')
            .limit(6)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstones',
            error: error.message
        });
    }
});

// @route   GET /api/gemstones/search
// @desc    Search gemstones with filters
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { keyword, type, carat, priceMin, priceMax } = req.query;

        let query = {
            status: 'available',
            approvalStatus: 'approved'
        };

        // Keyword search
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Type filter
        if (type && type !== 'All Types') {
            query.title = { $regex: type, $options: 'i' };
        }

        // Carat filter
        if (carat) {
            const [min, max] = carat.split('-').map(v => parseFloat(v));
            if (max) {
                query['attributes.carat'] = { $gte: min, $lte: max };
            } else {
                query['attributes.carat'] = { $gte: min };
            }
        }

        // Price filter
        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = parseFloat(priceMin);
            if (priceMax) query.price.$lte = parseFloat(priceMax);
        }

        const gemstones = await Gemstone.find(query)
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching gemstones',
            error: error.message
        });
    }
});

module.exports = router;