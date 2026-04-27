const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GemstoneApproval = require('../models/GemstoneApproval');
const { protect, authorize } = require('../middleware/auth');

const { sendEmail } = require('../services/emailService');

// ============================================
// SELLER APPROVALS - COMPLETE API
// All routes require authentication and admin role
// ============================================

// 1. Get all pending sellers
router.get('/sellers/pending', protect, authorize('admin'), async (req, res) => {
    try {
        const pendingSellers = await Seller.find({ verificationStatus: 'pending' })
            .populate('userId', 'name email createdAt')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingSellers.length,
            data: pendingSellers
        });
    } catch (error) {
        console.error('Error fetching pending sellers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending sellers',
            error: error.message
        });
    }
});

// 2. Get all sellers (with filters)
router.get('/sellers', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.verificationStatus = status;
        }

        if (search) {
            filter.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { businessRegistration: { $regex: search, $options: 'i' } }
            ];
        }

        const sellers = await Seller.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: sellers.length,
            data: sellers
        });
    } catch (error) {
        console.error('Error fetching sellers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sellers',
            error: error.message
        });
    }
});

// 3. Get single seller details (for review)
router.get('/sellers/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id)
            .populate('userId', 'name email createdAt');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        res.json({
            success: true,
            data: seller
        });
    } catch (error) {
        console.error('Error fetching seller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller details',
            error: error.message
        });
    }
});

// 4. Approve seller
router.put('/sellers/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        if (seller.verificationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Seller already ${seller.verificationStatus}`
            });
        }

        // Update seller status
        seller.verificationStatus = 'approved';
        seller.verifiedBy = req.user.id;
        seller.verifiedAt = new Date();
        seller.rejectionReason = null;
        await seller.save();

        // Update user role to seller
        await User.findByIdAndUpdate(seller.userId, {
            role: 'seller'
        });

        res.json({
            success: true,
            message: 'Seller approved successfully',
            data: seller
        });
    } catch (error) {
        console.error('Error approving seller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve seller',
            error: error.message
        });
    }
});

// 5. Reject seller
router.put('/sellers/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;

        const seller = await Seller.findById(req.params.id);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        if (seller.verificationStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Seller already ${seller.verificationStatus}`
            });
        }

        // Update seller status
        seller.verificationStatus = 'rejected';
        seller.verifiedBy = req.user.id;
        seller.verifiedAt = new Date();
        seller.rejectionReason = reason || 'No reason provided';
        await seller.save();

        res.json({
            success: true,
            message: 'Seller rejected',
            data: seller
        });
    } catch (error) {
        console.error('Error rejecting seller:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject seller',
            error: error.message
        });
    }
});

// 6. Get dashboard summary (for admin home)
router.get('/dashboard/summary', protect, authorize('admin'), async (req, res) => {
    try {
        const pendingSellers = await Seller.countDocuments({ verificationStatus: 'pending' });
        const totalSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
        const recentSellers = await Seller.find({ verificationStatus: 'pending' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                pendingCount: pendingSellers,
                totalSellers: totalSellers,
                recentRequests: recentSellers
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch summary',
            error: error.message
        });
    }
});

// ============================================
// REPORTS & ANALYTICS DASHBOARD
// ============================================

// 7. Get comprehensive dashboard analytics
router.get('/analytics/dashboard', protect, authorize('admin'), async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        // Date range based on period
        let startDate;
        const endDate = new Date();

        switch (period) {
            case 'week':
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(endDate);
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date(endDate);
                startDate.setMonth(endDate.getMonth() - 1);
        }

        // 1. Revenue Analytics
        const revenueData = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        type: '$type'
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. User Analytics
        const userData = await User.aggregate([
            {
                $match: { createdAt: { $gte: startDate, $lte: endDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 3. Transaction Summary
        const transactionSummary = await Transaction.aggregate([
            {
                $match: { createdAt: { $gte: startDate, $lte: endDate } }
            },
            {
                $group: {
                    _id: null,
                    totalVolume: { $sum: '$amount' },
                    totalCount: { $sum: 1 },
                    avgValue: { $avg: '$amount' },
                    topUpTotal: { $sum: { $cond: [{ $eq: ['$type', 'topup'] }, '$amount', 0] } },
                    purchaseTotal: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$amount', 0] } },
                    bidTotal: { $sum: { $cond: [{ $eq: ['$type', 'bid'] }, '$amount', 0] } }
                }
            }
        ]);

        // 4. Seller Analytics
        const sellerData = await Seller.aggregate([
            {
                $match: { createdAt: { $gte: startDate, $lte: endDate } }
            },
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 5. Gemstone Analytics
        const gemstoneData = await GemstoneApproval.aggregate([
            {
                $match: { createdAt: { $gte: startDate, $lte: endDate } }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 6. Recent Activity
        const recentActivity = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email');

        res.json({
            success: true,
            data: {
                period,
                dateRange: { startDate, endDate },
                revenue: revenueData,
                users: userData,
                transactionSummary: transactionSummary[0] || {
                    totalVolume: 0,
                    totalCount: 0,
                    avgValue: 0,
                    topUpTotal: 0,
                    purchaseTotal: 0,
                    bidTotal: 0
                },
                sellers: sellerData,
                gemstones: gemstoneData,
                recentActivity
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 8. Get revenue report with detailed breakdown
router.get('/reports/revenue', protect, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'month' } = req.query;

        const filter = {};
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        let groupFormat;
        switch (groupBy) {
            case 'day':
                groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case 'month':
                groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            case 'year':
                groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
                break;
            default:
                groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        }

        const revenueReport = await Transaction.aggregate([
            { $match: { status: 'completed', ...filter } },
            {
                $group: {
                    _id: groupFormat,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgValue: { $avg: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate totals
        const totals = await Transaction.aggregate([
            { $match: { status: 'completed', ...filter } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    averageTransaction: { $avg: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                report: revenueReport,
                summary: totals[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 },
                filters: { startDate, endDate, groupBy }
            }
        });
    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 9. Get user growth report
router.get('/reports/users', protect, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const filter = {};
        if (startDate) filter.createdAt = { $gte: new Date(startDate) };
        if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

        const userGrowth = await User.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const totals = await User.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                growth: userGrowth,
                totals: totals,
                totalUsers: await User.countDocuments(filter)
            }
        });
    } catch (error) {
        console.error('User report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 10. Get seller performance report
router.get('/reports/sellers', protect, authorize('admin'), async (req, res) => {
    try {
        const topSellers = await Transaction.aggregate([
            { $match: { type: 'purchase', status: 'completed' } },
            {
                $group: {
                    _id: '$sellerId',
                    totalSales: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } },
            { $limit: 10 }
        ]);

        // Populate seller details
        const populatedSellers = await Seller.populate(topSellers, {
            path: '_id',
            select: 'businessName userId'
        });

        const verificationStats = await Seller.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                topSellers: populatedSellers,
                verificationStats,
                totalSellers: await Seller.countDocuments()
            }
        });
    } catch (error) {
        console.error('Seller report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// DISPUTE MANAGEMENT
// ============================================

// Get all disputes (with filters)
router.get('/disputes', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        const filter = {};

        if (status && status !== 'all') filter.status = status;
        if (priority && priority !== 'all') filter.priority = priority;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const Dispute = require('../models/Dispute');

        const [disputes, total] = await Promise.all([
            Dispute.find(filter)
                .populate('buyerId', 'name email')
                .populate('sellerId', 'businessName')
                .populate('orderId')
                .populate('raisedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Dispute.countDocuments(filter)
        ]);

        // Get summary counts by status
        const summary = await Dispute.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: disputes,
            summary,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single dispute details
router.get('/disputes/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const Dispute = require('../models/Dispute');

        const dispute = await Dispute.findById(req.params.id)
            .populate('buyerId', 'name email')
            .populate('sellerId', 'businessName')
            .populate('orderId')
            .populate('raisedBy', 'name email')
            .populate('resolvedBy', 'name');

        if (!dispute) {
            return res.status(404).json({ success: false, message: 'Dispute not found' });
        }

        res.json({ success: true, data: dispute });
    } catch (error) {
        console.error('Error fetching dispute:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update dispute priority
router.put('/disputes/:id/priority', protect, authorize('admin'), async (req, res) => {
    try {
        const { priority } = req.body;
        const Dispute = require('../models/Dispute');

        const dispute = await Dispute.findByIdAndUpdate(
            req.params.id,
            { priority },
            { new: true }
        );

        if (!dispute) {
            return res.status(404).json({ success: false, message: 'Dispute not found' });
        }

        res.json({
            success: true,
            message: 'Dispute priority updated',
            data: dispute
        });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update dispute status
router.put('/disputes/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const Dispute = require('../models/Dispute');

        const dispute = await Dispute.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!dispute) {
            return res.status(404).json({ success: false, message: 'Dispute not found' });
        }

        res.json({
            success: true,
            message: 'Dispute status updated',
            data: dispute
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add note to dispute
router.post('/disputes/:id/notes', protect, authorize('admin'), async (req, res) => {
    try {
        const { note } = req.body;
        const Dispute = require('../models/Dispute');

        const dispute = await Dispute.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    notes: {
                        text: note,
                        createdBy: req.user.id,
                        createdAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!dispute) {
            return res.status(404).json({ success: false, message: 'Dispute not found' });
        }

        res.json({
            success: true,
            message: 'Note added',
            data: dispute
        });
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resolve dispute with financial action
router.put('/disputes/:id/resolve', protect, authorize('admin'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { resolution, action, refundAmount, notes } = req.body;
        const Dispute = require('../models/Dispute');
        const Transaction = require('../models/Transaction');
        const Wallet = require('../models/Wallet');

        const dispute = await Dispute.findById(req.params.id).session(session);

        if (!dispute) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Dispute not found' });
        }

        if (dispute.status === 'resolved' || dispute.status === 'closed') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Dispute already resolved' });
        }

        // Update dispute
        dispute.status = 'resolved';
        dispute.resolution = resolution;
        dispute.resolvedBy = req.user.id;
        dispute.resolvedAt = new Date();
        dispute.resolutionNotes = notes;
        dispute.action = action;
        await dispute.save({ session });

        // Handle financial action
        if (action === 'refund') {
            const amount = refundAmount || dispute.amount;

            // Refund to buyer's wallet
            await Wallet.findOneAndUpdate(
                { userId: dispute.buyerId },
                { $inc: { balance: amount } },
                { session, upsert: true }
            );

            // Create transaction record for refund
            await Transaction.create([{
                userId: dispute.buyerId,
                type: 'refund',
                amount: amount,
                status: 'completed',
                referenceId: dispute._id,
                description: `Refund for dispute #${dispute._id} - ${resolution}`
            }], { session });

        } else if (action === 'release') {
            // Release funds to seller
            await Wallet.findOneAndUpdate(
                { userId: dispute.sellerId },
                { $inc: { balance: dispute.amount } },
                { session, upsert: true }
            );

            // Create transaction record
            await Transaction.create([{
                userId: dispute.sellerId,
                type: 'payment',
                amount: dispute.amount,
                status: 'completed',
                referenceId: dispute._id,
                description: `Payment released from dispute #${dispute._id}`
            }], { session });

        } else if (action === 'partial') {
            // Partial refund to buyer, rest to seller
            const refundAmt = refundAmount || dispute.amount / 2;
            const sellerAmt = dispute.amount - refundAmt;

            await Wallet.findOneAndUpdate(
                { userId: dispute.buyerId },
                { $inc: { balance: refundAmt } },
                { session, upsert: true }
            );

            await Wallet.findOneAndUpdate(
                { userId: dispute.sellerId },
                { $inc: { balance: sellerAmt } },
                { session, upsert: true }
            );
        }

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Dispute resolved successfully',
            data: dispute
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error resolving dispute:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
});

// Get dispute statistics
router.get('/disputes/stats/summary', protect, authorize('admin'), async (req, res) => {
    try {
        const Dispute = require('../models/Dispute');

        const stats = await Dispute.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
                    investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
                    highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
                    urgentPriority: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {
                total: 0,
                open: 0,
                investigating: 0,
                resolved: 0,
                closed: 0,
                highPriority: 0,
                urgentPriority: 0
            }
        });
    } catch (error) {
        console.error('Error fetching dispute stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// ============================================
// GEMSTONE LISTING APPROVALS
// ============================================

// Get all pending gemstone listings (waiting for approval)
router.get('/gemstones/pending', protect, authorize('admin'), async (req, res) => {
    try {
        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        // Find all gemstone approvals with status 'pending'
        const pendingApprovals = await GemstoneApproval.find({ status: 'pending' })
            .populate({
                path: 'gemId',
                populate: {
                    path: 'sellerId',
                    select: 'name email'
                }
            })
            .populate('adminId', 'name')
            .sort({ createdAt: -1 });

        // Also fetch gemstones that don't have an approval record yet (for backward compatibility)
        const approvedGemIds = await GemstoneApproval.find().distinct('gemId');
        const gemstonesWithoutApproval = await Gemstone.find({
            _id: { $nin: approvedGemIds },
            status: 'available'
        }).populate('sellerId', 'name email');

        // Format the response
        const pendingListings = [
            ...pendingApprovals.map(approval => ({
                _id: approval._id,
                gemstone: approval.gemId,
                approvalStatus: approval.status,
                rejectionReason: approval.rejectionReason,
                reviewedAt: approval.reviewedAt,
                createdAt: approval.createdAt
            })),
            ...gemstonesWithoutApproval.map(gemstone => ({
                _id: null,
                gemstone: gemstone,
                approvalStatus: 'pending',
                rejectionReason: null,
                reviewedAt: null,
                createdAt: gemstone.createdAt
            }))
        ];

        res.json({
            success: true,
            count: pendingListings.length,
            data: pendingListings
        });
    } catch (error) {
        console.error('Error fetching pending gemstones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all gemstone listings (with filters)
router.get('/gemstones', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, type, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (type && type !== 'all') filter.type = type;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        const gemstones = await Gemstone.find(filter)
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get approval status for each gemstone
        const approvals = await GemstoneApproval.find({ gemId: { $in: gemstones.map(g => g._id) } });

        const gemstonesWithStatus = gemstones.map(gemstone => {
            const approval = approvals.find(a => a.gemId.toString() === gemstone._id.toString());
            return {
                ...gemstone.toObject(),
                approvalStatus: approval?.status || 'pending',
                rejectionReason: approval?.rejectionReason || null,
                reviewedAt: approval?.reviewedAt || null
            };
        });

        const total = await Gemstone.countDocuments(filter);

        res.json({
            success: true,
            data: gemstonesWithStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching gemstones:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single gemstone details for review
router.get('/gemstones/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        const gemstone = await Gemstone.findById(req.params.id)
            .populate('sellerId', 'name email');

        if (!gemstone) {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }

        const approval = await GemstoneApproval.findOne({ gemId: gemstone._id });

        res.json({
            success: true,
            data: {
                ...gemstone.toObject(),
                approvalStatus: approval?.status || 'pending',
                rejectionReason: approval?.rejectionReason || null,
                reviewedAt: approval?.reviewedAt || null
            }
        });
    } catch (error) {
        console.error('Error fetching gemstone:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve gemstone listing
router.put('/gemstones/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        const gemstone = await Gemstone.findById(req.params.id);

        if (!gemstone) {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }

        // Find or create approval record
        let approval = await GemstoneApproval.findOne({ gemId: gemstone._id });

        if (approval) {
            approval.status = 'approved';
            approval.adminId = req.user.id;
            approval.reviewedAt = new Date();
            approval.rejectionReason = null;
            await approval.save();
        } else {
            approval = await GemstoneApproval.create({
                gemId: gemstone._id,
                adminId: req.user.id,
                status: 'approved',
                reviewedAt: new Date()
            });
        }

        // Update gemstone status directly on model
        gemstone.status = 'available';
        gemstone.approvalStatus = 'approved';
        gemstone.rejectionReason = null;
        await gemstone.save();

        res.json({
            success: true,
            message: 'Gemstone listing approved successfully',
            data: approval
        });
    } catch (error) {
        console.error('Error approving gemstone:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject gemstone listing
router.put('/gemstones/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;
        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        const gemstone = await Gemstone.findById(req.params.id);

        if (!gemstone) {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }

        // Find or create approval record
        let approval = await GemstoneApproval.findOne({ gemId: gemstone._id });

        if (approval) {
            approval.status = 'rejected';
            approval.adminId = req.user.id;
            approval.reviewedAt = new Date();
            approval.rejectionReason = reason || 'Does not meet platform standards';
            await approval.save();
        } else {
            approval = await GemstoneApproval.create({
                gemId: gemstone._id,
                adminId: req.user.id,
                status: 'rejected',
                rejectionReason: reason || 'Does not meet platform standards',
                reviewedAt: new Date()
            });
        }

        // Update gemstone status and internal reason directly on model
        gemstone.status = 'delisted';
        gemstone.approvalStatus = 'rejected';
        gemstone.rejectionReason = reason || 'Does not meet platform standards';
        await gemstone.save();

        res.json({
            success: true,
            message: 'Gemstone listing rejected',
            data: approval
        });
    } catch (error) {
        console.error('Error rejecting gemstone:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get gemstone approval statistics
router.get('/gemstones/stats/summary', protect, authorize('admin'), async (req, res) => {
    try {
        const Gemstone = require('../models/Gemstone');
        const GemstoneApproval = require('../models/GemstoneApproval');

        const totalListings = await Gemstone.countDocuments();
        const pendingApprovals = await GemstoneApproval.countDocuments({ status: 'pending' });
        const approved = await GemstoneApproval.countDocuments({ status: 'approved' });
        const rejected = await GemstoneApproval.countDocuments({ status: 'rejected' });

        // Count gemstones without approval record
        const approvedGemIds = await GemstoneApproval.find().distinct('gemId');
        const withoutApproval = await Gemstone.countDocuments({ _id: { $nin: approvedGemIds } });

        res.json({
            success: true,
            data: {
                totalListings,
                pending: pendingApprovals + withoutApproval,
                approved,
                rejected,
                withoutApproval
            }
        });
    } catch (error) {
        console.error('Error fetching gemstone stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



// ============================================
// TRANSACTION MONITOR
// ============================================

// Get all transactions with filters
router.get('/transactions', protect, authorize('admin'), async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            type,
            status,
            minAmount,
            maxAmount,
            userId,
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Type filter
        if (type && type !== 'all') filter.type = type;

        // Status filter
        if (status && status !== 'all') filter.status = status;

        // User filter
        if (userId) filter.userId = userId;

        // Amount range filter
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const Transaction = require('../models/Transaction');
        const TopUpRequest = require('../models/TopUpRequest');

        const transactionFilter = {};
        if (filter.createdAt) transactionFilter.createdAt = filter.createdAt;
        if (type && type !== 'all') transactionFilter.type = type;
        if (status && status !== 'all') transactionFilter.status = status;
        if (userId) transactionFilter.userId = userId;
        if (filter.amount) transactionFilter.amount = filter.amount;

        const topUpFilter = {};
        if (startDate || endDate) {
            topUpFilter.requestedAt = {};
            if (startDate) topUpFilter.requestedAt.$gte = new Date(startDate);
            if (endDate) topUpFilter.requestedAt.$lte = new Date(endDate);
        }
        if (status && status !== 'all') topUpFilter.status = status;
        if (userId) topUpFilter.userId = userId;
        if (minAmount || maxAmount) {
            topUpFilter.amount = {};
            if (minAmount) topUpFilter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) topUpFilter.amount.$lte = parseFloat(maxAmount);
        }

        const includeTopUps = !type || type === 'all' || type === 'deposit';

        const [transactions, topUpRequests] = await Promise.all([
            Transaction.find(transactionFilter)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 }),
            includeTopUps
                ? TopUpRequest.find(topUpFilter)
                    .populate('userId', 'name email')
                    .populate('approvedBy', 'name email')
                    .sort({ requestedAt: -1 })
                : Promise.resolve([])
        ]);

        const normalizedTransactions = transactions.map((transaction) => ({
            ...transaction.toObject(),
            source: 'transaction',
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        }));

        const normalizedTopUps = topUpRequests.map((request) => ({
            _id: request._id,
            source: 'topup',
            userId: request.userId,
            walletId: null,
            relatedId: null,
            type: 'deposit',
            amount: request.amount,
            status: request.status,
            description: `Wallet top-up request - Ref: ${request.bankReference || 'N/A'}`,
            title: 'Wallet Top-Up Request',
            subtitle: request.paymentMethod || 'bankTransfer',
            createdAt: request.requestedAt || request.createdAt,
            updatedAt: request.updatedAt,
            metadata: {
                bankReference: request.bankReference,
                receiptImage: request.receiptImage,
                paymentMethod: request.paymentMethod,
                approvedBy: request.approvedBy,
                approvedAt: request.approvedAt || null,
                rejectionReason: request.rejectionReason || null,
            }
        }));

        const mergedTransactions = [...normalizedTransactions, ...normalizedTopUps].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        const total = mergedTransactions.length;
        const paginatedTransactions = mergedTransactions.slice(skip, skip + parseInt(limit));

        const summary = mergedTransactions.reduce((acc, item) => {
            const amountValue = Number(item.amount) || 0;
            acc.totalVolume += amountValue;
            acc.totalTransactions += 1;

            if (item.type === 'deposit') {
                acc.totalDeposits += amountValue;
                acc.depositCount += 1;
            } else if (item.type === 'withdrawal') {
                acc.totalWithdrawals += amountValue;
                acc.withdrawalCount += 1;
            } else if (item.type === 'bid') {
                acc.totalBids += amountValue;
                acc.bidCount += 1;
            } else if (item.type === 'refund') {
                acc.totalRefunds += amountValue;
            } else if (item.type === 'payment') {
                acc.totalPayments += amountValue;
            }

            return acc;
        }, {
            totalVolume: 0,
            totalTransactions: 0,
            avgTransaction: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalBids: 0,
            totalRefunds: 0,
            totalPayments: 0,
            depositCount: 0,
            withdrawalCount: 0,
            bidCount: 0
        });

        summary.avgTransaction = summary.totalTransactions > 0
            ? summary.totalVolume / summary.totalTransactions
            : 0;
        summary.totalTopups = summary.totalDeposits;

        const typeBreakdownMap = mergedTransactions.reduce((acc, item) => {
            const key = item.type;
            if (!acc[key]) {
                acc[key] = { _id: key, total: 0, count: 0 };
            }
            acc[key].total += Number(item.amount) || 0;
            acc[key].count += 1;
            return acc;
        }, {});

        const typeBreakdown = Object.values(typeBreakdownMap);

        res.json({
            success: true,
            data: paginatedTransactions,
            summary: summary.totalTransactions > 0 ? summary : {
                totalVolume: 0,
                totalTransactions: 0,
                avgTransaction: 0,
                totalDeposits: 0,
                totalTopups: 0,
                totalWithdrawals: 0,
                totalBids: 0,
                totalRefunds: 0,
                totalPayments: 0,
                depositCount: 0,
                withdrawalCount: 0,
                bidCount: 0
            },
            typeBreakdown,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve wallet top-up request
router.put('/transactions/topups/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const TopUpRequest = require('../models/TopUpRequest');
        const Wallet = require('../models/Wallet');

        const topUpRequest = await TopUpRequest.findById(req.params.id).populate('userId');

        if (!topUpRequest) {
            return res.status(404).json({ success: false, message: 'Top-up request not found' });
        }

        if (topUpRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Top-up request already ${topUpRequest.status}`
            });
        }

        const wallet = await Wallet.findOneAndUpdate(
            { userId: topUpRequest.userId._id },
            {
                $inc: {
                    balance: Number(topUpRequest.amount) || 0,
                    totalDeposited: Number(topUpRequest.amount) || 0
                }
            },
            { new: true }
        );

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found for this user' });
        }

        topUpRequest.status = 'approved';
        topUpRequest.approvedBy = req.user.id;
        topUpRequest.approvedAt = new Date();
        topUpRequest.rejectionReason = null;
        await topUpRequest.save();

        // Send approval email
        if (topUpRequest.userId && topUpRequest.userId.email) {
            console.log(' Sending approval email to:', topUpRequest.userId.email);

            await sendEmail(
                topUpRequest.userId.email,
                'TOPUP_APPROVED',
                topUpRequest.userId.name,
                topUpRequest.amount,
                topUpRequest.bankReference
            );
            console.log(`✅ Approval email sent to ${topUpRequest.userId.email}`);
        } else {
            console.log('⚠️ No user email found');
        }

        res.json({
            success: true,
            message: 'Top-up request approved successfully',
            data: {
                topUpRequest,
                wallet
            }
        });
    } catch (error) {
        console.error('Error approving top-up request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject wallet top-up request
router.put('/transactions/topups/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const { reason } = req.body;
        const TopUpRequest = require('../models/TopUpRequest');

        const topUpRequest = await TopUpRequest.findById(req.params.id).populate('userId');

        if (!topUpRequest) {
            return res.status(404).json({ success: false, message: 'Top-up request not found' });
        }

        if (topUpRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Top-up request already ${topUpRequest.status}`
            });
        }

        topUpRequest.status = 'rejected';
        topUpRequest.approvedBy = req.user.id;
        topUpRequest.approvedAt = new Date();
        topUpRequest.rejectionReason = reason || 'Rejected by admin';
        await topUpRequest.save();

        // Send rejection email
        if (topUpRequest.userId && topUpRequest.userId.email) {
            console.log('Sending rejection email to:', topUpRequest.userId.email);

            await sendEmail(
                topUpRequest.userId.email,
                'TOPUP_REJECTED',
                topUpRequest.userId.name,
                topUpRequest.amount,
                topUpRequest.bankReference,
                reason
            );
            console.log(`✅ Rejection email sent to ${topUpRequest.userId.email}`);
        } else {
            console.log('⚠️ No user email found');
        }

        res.json({
            success: true,
            message: 'Top-up request rejected',
            data: topUpRequest
        });
    } catch (error) {
        console.error('Error rejecting top-up request:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single transaction details
router.get('/transactions/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');

        const transaction = await Transaction.findById(req.params.id)
            .populate('userId', 'name email');

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export transactions as CSV
router.get('/transactions/export/csv', protect, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const Transaction = require('../models/Transaction');
        const TopUpRequest = require('../models/TopUpRequest');

        const transactionFilter = {};
        if (startDate) transactionFilter.createdAt = { $gte: new Date(startDate) };
        if (endDate) transactionFilter.createdAt = { ...transactionFilter.createdAt, $lte: new Date(endDate) };

        const topUpFilter = {};
        if (startDate) topUpFilter.requestedAt = { $gte: new Date(startDate) };
        if (endDate) topUpFilter.requestedAt = { ...topUpFilter.requestedAt, $lte: new Date(endDate) };

        const [transactions, topUpRequests] = await Promise.all([
            Transaction.find(transactionFilter)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 }),
            TopUpRequest.find(topUpFilter)
                .populate('userId', 'name email')
                .sort({ requestedAt: -1 })
        ]);

        // Create CSV header
        const headers = ['Date', 'User', 'Email', 'Type', 'Amount', 'Status', 'Description', 'Wallet ID'];

        // Create CSV rows
        const transactionRows = transactions.map(t => ([
            new Date(t.createdAt).toLocaleString(),
            t.userId?.name || 'Unknown',
            t.userId?.email || '',
            t.type,
            t.amount,
            t.status,
            t.description || '',
            t.walletId || ''
        ]));

        const topUpRows = topUpRequests.map(t => ([
            new Date(t.requestedAt || t.createdAt).toLocaleString(),
            t.userId?.name || 'Unknown',
            t.userId?.email || '',
            'deposit',
            t.amount,
            t.status,
            `Wallet top-up request - Ref: ${t.bankReference || 'N/A'}`,
            ''
        ]));

        const csvContent = [headers, ...transactionRows, ...topUpRows].map(row => row.join(',')).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions_${new Date().toISOString()}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting transactions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
