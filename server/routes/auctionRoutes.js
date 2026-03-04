const express = require('express');
const router = express.Router();
const { Auction, Gemstone, Bid } = require('../models');

// @route   GET /api/auctions/live
// @desc    Get live auctions
// @access  Public
router.get('/live', async (req, res) => {
    try {
        const now = new Date();

        const auctions = await Auction.find({
            status: 'active',
            endTime: { $gt: now }
        })
            .populate({
                path: 'gemId',
                select: 'title description attributes images'
            })
            .populate('sellerId', 'name')
            .sort({ endTime: 1 })
            .limit(8);

        // Calculate time remaining for each auction
        const auctionsWithTime = auctions.map(auction => {
            const timeRemaining = auction.endTime - now;
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

            return {
                ...auction.toObject(),
                timeRemaining: {
                    hours,
                    minutes,
                    formatted: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
                }
            };
        });

        res.json({
            success: true,
            count: auctionsWithTime.length,
            data: auctionsWithTime
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching auctions',
            error: error.message
        });
    }
});

module.exports = router;