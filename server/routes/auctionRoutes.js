const express = require('express');
const router = express.Router();
const { Auction, Gemstone, Bid } = require('../models');
const { protect } = require('../middleware/auth');

// @route   GET /api/auctions/available-gemstones
// @desc    Get only available gemstones for auction creation
// @access  Private
router.get('/available-gemstones', protect, async (req, res) => {
    try {
        const availableGems = await Gemstone.find({
            status: 'available',
            sellerId: req.user.id
        })
            .select('title type price attributes images')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: availableGems.length,
            data: availableGems
        });
    } catch (error) {
        console.error('❌ Error fetching available gemstones:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching available gemstones',
            error: error.message
        });
    }
});

// @route   POST /api/auctions
// @desc    Create a new auction
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        console.log('📝 Auction creation request received');
        console.log('User ID:', req.user.id);
        console.log('Request body:', req.body);

        const { gemId, startPrice, currentPrice, minIncrement, reservePrice, startTime, endTime } = req.body;

        // Validation - Check all required fields
        if (!gemId || !startPrice || !currentPrice || !minIncrement || !startTime || !endTime) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        console.log('✅ All fields present');

        // Check if gemstone exists
        const gemstone = await Gemstone.findById(gemId);
        console.log('Gemstone found:', gemstone ? 'Yes' : 'No');

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        // Check if gemstone belongs to the user (only seller can auction their own gems)
        if (gemstone.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only auction your own gemstones'
            });
        }

        // Check if gemstone status is AVAILABLE
        if (gemstone.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `This gemstone is ${gemstone.status} and cannot be auctioned. Only available gemstones can be auctioned.`
            });
        }

        // Check if gemstone is already in an active auction
        const existingAuction = await Auction.findOne({
            gemId: gemId,
            status: { $in: ['scheduled', 'active'] }
        });

        if (existingAuction) {
            return res.status(400).json({
                success: false,
                message: 'This gemstone is already in an active auction'
            });
        }

        console.log('✅ Gemstone validation passed');

        // Validate dates
        const startTimeDate = new Date(startTime);
        const endTimeDate = new Date(endTime);
        const now = new Date();

        console.log('Start time:', startTimeDate);
        console.log('End time:', endTimeDate);
        console.log('Now:', now);

        if (startTimeDate < now) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be in the future'
            });
        }

        if (endTimeDate <= startTimeDate) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Validate minimum 1 hour duration
        const durationHours = (endTimeDate - startTimeDate) / (1000 * 60 * 60);
        if (durationHours < 1) {
            return res.status(400).json({
                success: false,
                message: 'Auction must be at least 1 hour long'
            });
        }

        console.log('✅ Date validation passed');

        // Create auction
        const auctionData = {
            gemId: gemId,
            sellerId: req.user.id,
            startPrice: parseFloat(startPrice),
            currentPrice: parseFloat(currentPrice),
            minIncrement: parseFloat(minIncrement),
            reservePrice: reservePrice ? parseFloat(reservePrice) : null,
            startTime: startTimeDate,
            endTime: endTimeDate,
            status: 'scheduled',
            totalBids: 0
        };

        console.log('Creating auction with data:', auctionData);

        const auction = await Auction.create(auctionData);

        console.log('✅ Auction created:', auction._id);

        // UPDATE GEMSTONE STATUS TO UNDER AUCTION
        await Gemstone.findByIdAndUpdate(
            gemId,
            { status: 'underAuction' },
            { new: true }
        );

        console.log('✅ Gemstone status updated to underAuction');

        // Populate and return
        const populatedAuction = await Auction.findById(auction._id)
            .populate('gemId', 'title type price images attributes')
            .populate('sellerId', 'name email');

        console.log('✅ Auction populated and ready to send');

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            data: populatedAuction
        });
    } catch (error) {
        console.error('❌ Auction creation error:');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Error creating auction',
            error: error.message
        });
    }
});

// @route   GET /api/auctions
// @desc    Get all auctions with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const total = await Auction.countDocuments(query);
        const auctions = await Auction.find(query)
            .populate('gemId', 'title type price images attributes')
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: auctions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching auctions',
            error: error.message
        });
    }
});

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

// @route   GET /api/auctions/:id
// @desc    Get auction by ID with bids
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('gemId')
            .populate('sellerId', 'name email')
            .populate('winnerId', 'name email');

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Get bids
        const bids = await Bid.find({ auctionId: req.params.id })
            .populate('bidderId', 'name email')
            .sort({ bidTime: -1 });

        res.json({
            success: true,
            data: {
                auction,
                bids
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching auction',
            error: error.message
        });
    }
});

// @route   POST /api/auctions/:id/bid
// @desc    Place a bid on an auction
// @access  Private
router.post('/:id/bid', protect, async (req, res) => {
    try {
        const { bidAmount } = req.body;

        if (!bidAmount) {
            return res.status(400).json({
                success: false,
                message: 'Bid amount is required'
            });
        }

        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        if (auction.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This auction is not active'
            });
        }

        const now = new Date();
        if (now > auction.endTime) {
            return res.status(400).json({
                success: false,
                message: 'Auction has ended'
            });
        }

        const minBidAmount = parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement);

        if (parseFloat(bidAmount) < minBidAmount) {
            return res.status(400).json({
                success: false,
                message: `Bid must be at least $${minBidAmount.toFixed(2)}`
            });
        }

        // Create bid
        const bid = await Bid.create({
            auctionId: req.params.id,
            bidderId: req.user.id,
            bidAmount: parseFloat(bidAmount),
            isWinning: true
        });

        // Update auction
        auction.currentPrice = parseFloat(bidAmount);
        auction.totalBids += 1;
        auction.winnerId = req.user.id;
        await auction.save();

        const populatedBid = await Bid.findById(bid._id)
            .populate('bidderId', 'name email');

        res.json({
            success: true,
            message: 'Bid placed successfully',
            data: populatedBid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error placing bid',
            error: error.message
        });
    }
});

// @route   PATCH /api/auctions/:id/close
// @desc    Close an auction (seller only)
// @access  Private
router.patch('/:id/close', protect, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if user is the seller
        if (auction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can close this auction'
            });
        }

        auction.status = 'ended';
        await auction.save();

        // UPDATE GEMSTONE STATUS TO SOLD IF THERE WAS A WINNER
        if (auction.winnerId) {
            await Gemstone.findByIdAndUpdate(
                auction.gemId,
                { status: 'sold' },
                { new: true }
            );
            console.log('✅ Gemstone status updated to sold');
        } else {
            // If no winner, revert to available
            await Gemstone.findByIdAndUpdate(
                auction.gemId,
                { status: 'available' },
                { new: true }
            );
            console.log('✅ Gemstone status reverted to available');
        }

        res.json({
            success: true,
            message: 'Auction closed successfully',
            data: auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error closing auction',
            error: error.message
        });
    }
});

// @route   PATCH /api/auctions/:id/cancel
// @desc    Cancel an auction (seller only, before it starts)
// @access  Private
router.patch('/:id/cancel', protect, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if user is the seller
        if (auction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can cancel this auction'
            });
        }

        // Check if auction has already started
        if (auction.status === 'active' || auction.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an active or ended auction'
            });
        }

        auction.status = 'cancelled';
        await auction.save();

        // Revert gemstone status to available
        await Gemstone.findByIdAndUpdate(
            auction.gemId,
            { status: 'available' },
            { new: true }
        );

        console.log('✅ Auction cancelled, gemstone status reverted to available');

        res.json({
            success: true,
            message: 'Auction cancelled successfully',
            data: auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling auction',
            error: error.message
        });
    }
});

module.exports = router;