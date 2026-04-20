const express = require('express');
const router = express.Router();
const { Auction, Gemstone, Bid, AuctionHistory, Wallet, Transaction } = require('../models');
const { protect } = require('../middleware/auth');

// ✅ SPECIFIC ROUTES FIRST (before /:id)

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

// @route   GET /api/auctions/my-participation
// @desc    Get all auctions the user has participated in (bid placed)
// @access  Private
router.get('/my-participation', protect, async (req, res) => {
    try {
        console.log('📊 Fetching auction participation for user:', req.user.id);

        // Find all bids placed by this user
        const bids = await Bid.find({ bidderId: req.user.id })
            .distinct('auctionId');

        console.log('✅ Found bids in auctions:', bids.length);

        // Get all auctions the user participated in
        const auctions = await Auction.find({ _id: { $in: bids } })
            .populate('gemId', 'title')
            .populate('winnerId', 'name')
            .lean();

        console.log('✅ Found auctions:', auctions.length);

        // Count bids for each auction
        const auctionBidCounts = await Promise.all(
            auctions.map(async (auction) => {
                const bidCount = await Bid.countDocuments({ auctionId: auction._id });
                return {
                    ...auction,
                    gemName: auction.gemId?.title || 'Unknown Gem',
                    status: auction.status,
                    startTime: auction.startTime,
                    endTime: auction.endTime,
                    startPrice: auction.startPrice,
                    currentPrice: auction.currentPrice,
                    winnerId: auction.winnerId?._id,
                    winnerName: auction.winnerId?.name || 'No Winner',
                    bidsCount: bidCount
                };
            })
        );

        res.json({
            success: true,
            data: auctionBidCounts
        });
    } catch (error) {
        console.error('❌ Error fetching auction participation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch auction participation data',
            error: error.message
        });
    }
});

// @route   GET /api/auctions/seller/my-auctions
// @desc    Get all auctions created by seller with bid details
// @access  Private
router.get('/seller/my-auctions', protect, async (req, res) => {
    try {
        console.log('📊 Fetching seller auctions for user:', req.user.id);

        // Get all auctions created by this seller
        const auctions = await Auction.find({ sellerId: req.user.id })
            .populate('gemId', 'title')
            .populate('winnerId', 'name')
            .lean();

        console.log('✅ Found seller auctions:', auctions.length);

        // Get bid details for each auction
        const auctionsWithBids = await Promise.all(
            auctions.map(async (auction) => {
                const bids = await Bid.find({ auctionId: auction._id })
                    .populate('bidderId', 'name')
                    .lean();

                return {
                    _id: auction._id,
                    gemName: auction.gemId?.title || 'Unknown Gem',
                    status: auction.status,
                    startTime: auction.startTime,
                    endTime: auction.endTime,
                    startPrice: auction.startPrice,
                    currentPrice: auction.currentPrice,
                    reservePrice: auction.reservePrice,
                    winnerId: auction.winnerId?._id,
                    winnerName: auction.winnerId?.name || 'No Winner',
                    totalBids: auction.totalBids,
                    bids: bids.map(bid => ({
                        bidderName: bid.bidderId?.name || 'Unknown',
                        amount: bid.bidAmount,
                        bidTime: bid.bidTime,
                        isWinning: bid.isWinning
                    }))
                };
            })
        );

        console.log('✅ Formatted auctions with bids');

        res.json({
            success: true,
            data: auctionsWithBids
        });
    } catch (error) {
        console.error('❌ Error fetching seller auctions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller auction data',
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

// ✅ GENERAL ROUTES (less specific)

// @route   POST /api/auctions
// @desc    Create a new auction
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        console.log('📝 Auction creation request received');
        console.log('User ID:', req.user.id);
        console.log('Request body:', req.body);

        const { gemId, startPrice, currentPrice, minIncrement, reservePrice, startTime, endTime } = req.body;

        if (!gemId || !startPrice || !currentPrice || !minIncrement || !startTime || !endTime) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        console.log('✅ All fields present');

        const gemstone = await Gemstone.findById(gemId);
        console.log('Gemstone found:', gemstone ? 'Yes' : 'No');

        if (!gemstone) {
            return res.status(404).json({
                success: false,
                message: 'Gemstone not found'
            });
        }

        if (gemstone.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only auction your own gemstones'
            });
        }

        if (gemstone.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `This gemstone is ${gemstone.status} and cannot be auctioned. Only available gemstones can be auctioned.`
            });
        }

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

        const durationHours = (endTimeDate - startTimeDate) / (1000 * 60 * 60);
        if (durationHours < 1) {
            return res.status(400).json({
                success: false,
                message: 'Auction must be at least 1 hour long'
            });
        }

        console.log('✅ Date validation passed');

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

        await Gemstone.findByIdAndUpdate(
            gemId,
            { status: 'underAuction' },
            { new: true }
        );

        console.log('✅ Gemstone status updated to underAuction');

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

        if (!bidAmount || bidAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bid amount'
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

        // Get current bidder's wallet
        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet || wallet.balance < parseFloat(bidAmount)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance to place this bid'
            });
        }

        // Get previous highest bid (if any)
        const previousHighestBid = await Bid.findOne({
            auctionId: req.params.id,
            isWinning: true
        });

        let previousBidAmount = 0;
        let previousBidderId = null;

        // Handle previous bidder - release their held funds
        if (previousHighestBid) {
            previousBidAmount = previousHighestBid.bidAmount;
            previousBidderId = previousHighestBid.bidderId;

            // Mark previous highest bidder as outbid
            previousHighestBid.isWinning = false;
            previousHighestBid.isOutbid = true;
            await previousHighestBid.save();

            // Release held funds from previous bidder - ADD BACK to balance
            const previousBidderWallet = await Wallet.findOne({ userId: previousBidderId });
            if (previousBidderWallet) {
                previousBidderWallet.balance += previousBidAmount;
                previousBidderWallet.heldFunds -= previousBidAmount;

                if (previousBidderWallet.heldFunds < 0) {
                    previousBidderWallet.heldFunds = 0;
                }

                await previousBidderWallet.save();

                await Transaction.create({
                    walletId: previousBidderWallet._id,
                    type: 'refund',
                    amount: previousBidAmount,
                    status: 'completed',
                    description: `Outbid refund for auction: ${auction._id}`,
                    relatedId: auction._id
                });

                console.log(`✅ Released $${previousBidAmount} back to bidder ${previousBidderId}`);
            }
        }

        wallet.balance -= parseFloat(bidAmount);
        wallet.heldFunds += parseFloat(bidAmount);

        if (wallet.balance < 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient wallet balance'
            });
        }

        await wallet.save();

        await Transaction.create({
            walletId: wallet._id,
            type: 'bid',
            amount: parseFloat(bidAmount),
            status: 'pending',
            description: `Bid hold for auction: ${auction._id}`,
            relatedId: auction._id
        });

        console.log(`✅ Held $${bidAmount} from bidder ${req.user.id}`);

        const bid = await Bid.create({
            auctionId: req.params.id,
            bidderId: req.user.id,
            bidAmount: parseFloat(bidAmount),
            isWinning: true,
            isOutbid: false
        });

        const oldPrice = auction.currentPrice;
        auction.currentPrice = parseFloat(bidAmount);
        auction.totalBids += 1;
        auction.winnerId = req.user.id;
        await auction.save();

        await AuctionHistory.create({
            auctionId: req.params.id,
            action: 'bid_placed',
            userId: req.user.id,
            details: {
                bidAmount: parseFloat(bidAmount),
                previousPrice: oldPrice,
                bidderId: req.user.id,
                outbidUser: previousBidderId
            }
        });

        const populatedBid = await Bid.findById(bid._id)
            .populate('bidderId', 'name email');

        const updatedAuction = await Auction.findById(req.params.id)
            .populate('gemId', 'title type price images attributes')
            .populate('sellerId', 'name email')
            .populate('winnerId', 'name email');

        const bids = await Bid.find({ auctionId: req.params.id })
            .populate('bidderId', 'name email')
            .sort({ bidTime: -1 });

        const updatedWallet = await Wallet.findOne({ userId: req.user.id });

        if (global.broadcastAuctionUpdate) {
            global.broadcastAuctionUpdate({
                auctionId: req.params.id,
                currentPrice: updatedAuction.currentPrice,
                totalBids: updatedAuction.totalBids,
                winnerId: updatedAuction.winnerId
            });
        }

        res.json({
            success: true,
            message: 'Bid placed successfully',
            data: {
                bid: populatedBid,
                auction: updatedAuction,
                allBids: bids,
                wallet: {
                    balance: updatedWallet.balance,
                    heldFunds: updatedWallet.heldFunds,
                    availableBalance: updatedWallet.balance - updatedWallet.heldFunds
                }
            }
        });

    } catch (error) {
        console.error('❌ Error placing bid:', error);
        res.status(500).json({
            success: false,
            message: 'Error placing bid',
            error: error.message
        });
    }
});

// @route   GET /api/auctions/:id/bids
// @desc    Get all bids for an auction (real-time)
// @access  Public
router.get('/:id/bids', async (req, res) => {
    try {
        const bids = await Bid.find({ auctionId: req.params.id })
            .populate('bidderId', 'name email')
            .sort({ bidTime: -1 });

        const auction = await Auction.findById(req.params.id);

        res.json({
            success: true,
            data: {
                bids,
                currentPrice: auction?.currentPrice || 0,
                totalBids: auction?.totalBids || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching bids',
            error: error.message
        });
    }
});

// @route   GET /api/auctions/:id/history
// @desc    Get auction history
// @access  Public
router.get('/:id/history', async (req, res) => {
    try {
        const history = await AuctionHistory.find({ auctionId: req.params.id })
            .populate('userId', 'name email')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching auction history',
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

        if (auction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can close this auction'
            });
        }

        auction.status = 'ended';
        await auction.save();

        if (auction.winnerId) {
            await Gemstone.findByIdAndUpdate(
                auction.gemId,
                { status: 'sold' },
                { new: true }
            );
            console.log('✅ Gemstone status updated to sold');

            const winnerWallet = await Wallet.findOne({ userId: auction.winnerId });
            if (winnerWallet) {
                winnerWallet.totalSpent += winnerWallet.heldFunds;
                winnerWallet.heldFunds = 0;
                await winnerWallet.save();

                await Transaction.create({
                    walletId: winnerWallet._id,
                    type: 'payment',
                    amount: (await Bid.findOne({ auctionId: req.params.id, isWinning: true }))?.bidAmount || 0,
                    status: 'completed',
                    description: `Auction won - payment finalized for auction: ${auction._id}`,
                    relatedId: auction._id
                });
            }
        } else {
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

        if (auction.sellerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the seller can cancel this auction'
            });
        }

        if (auction.status === 'active' || auction.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an active or ended auction'
            });
        }

        auction.status = 'cancelled';
        await auction.save();

        await Gemstone.findByIdAndUpdate(
            auction.gemId,
            { status: 'available' },
            { new: true }
        );

        const highestBid = await Bid.findOne({
            auctionId: req.params.id,
            isWinning: true
        });

        if (highestBid) {
            const bidderWallet = await Wallet.findOne({ userId: highestBid.bidderId });
            if (bidderWallet) {
                bidderWallet.balance += highestBid.bidAmount;
                bidderWallet.heldFunds -= highestBid.bidAmount;

                if (bidderWallet.heldFunds < 0) {
                    bidderWallet.heldFunds = 0;
                }

                await bidderWallet.save();

                await Transaction.create({
                    walletId: bidderWallet._id,
                    type: 'refund',
                    amount: highestBid.bidAmount,
                    status: 'completed',
                    description: `Auction cancelled refund for auction: ${auction._id}`,
                    relatedId: auction._id
                });
            }
        }

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