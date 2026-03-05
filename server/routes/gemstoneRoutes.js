const express = require('express');
const router = express.Router();
const { Gemstone, User, Auction } = require('../models');
const { protect, authorize } = require('../middleware/auth');

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

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (type && type !== 'All Types') {
            query.title = { $regex: type, $options: 'i' };
        }

        if (carat) {
            const [min, max] = carat.split('-').map(v => parseFloat(v));
            if (max) {
                query['attributes.carat'] = { $gte: min, $lte: max };
            } else {
                query['attributes.carat'] = { $gte: min };
            }
        }

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

// @route   POST /api/gemstones
// @desc    Create a new gemstone listing
// @access  Private (Sellers only)
router.post('/', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const {
            title,
            description,
            attributes,
            images,
            certifications,
            sellingMethod,
            price,
            auctionDetails
        } = req.body;

        // Validation
        if (!title || !description || !attributes || !images || !sellingMethod) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required'
            });
        }

        // Create gemstone
        const gemstone = await Gemstone.create({
            sellerId: req.user.id,
            title,
            description,
            attributes,
            images,
            certifications: certifications || [],
            sellingMethod,
            price: sellingMethod === 'instantPurchase' ? price : null,
            status: 'available',
            approvalStatus: 'pending'
        });

        // If auction, create auction record
        if (sellingMethod === 'auction') {
            await Auction.create({
                gemId: gemstone._id,
                sellerId: req.user.id,
                startPrice: auctionDetails.startPrice,
                currentPrice: auctionDetails.startPrice,
                minIncrement: auctionDetails.minIncrement,
                reservePrice: auctionDetails.reservePrice || null,
                startTime: auctionDetails.startTime,
                endTime: auctionDetails.endTime,
                status: new Date(auctionDetails.startTime) <= new Date() ? 'active' : 'scheduled',
                totalBids: 0
            });
        }

        res.status(201).json({
            success: true,
            message: 'Gemstone listing created successfully! Pending admin approval.',
            data: gemstone
        });

    } catch (error) {
        console.error('Error creating gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating gemstone listing',
            error: error.message
        });
    }
});

module.exports = router;