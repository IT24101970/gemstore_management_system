const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GemstoneApproval = require('../models/GemstoneApproval');
const { protect, authorize } = require('../middleware/auth');

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

module.exports = router;