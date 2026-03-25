const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const User = require('../models/User');
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

module.exports = router;