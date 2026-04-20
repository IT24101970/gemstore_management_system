const express = require('express');
const multer = require('multer');
const router = express.Router();
const { Wallet, TopUpRequest, User, Customer, Transaction } = require('../models');
const { protect } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
;
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const valid = /\.(jpg|jpeg|png|pdf)$/i.test(file.originalname);
        if (valid) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed'));
        }
    }
});

// ============================================
// Helper function to upload to Cloudinary
// ============================================
const uploadToCloudinary = (buffer, folder, filename) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `ceylon-gems/${folder}`,
                resource_type: 'auto',
                public_id: filename
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// ============================================
// Helper function to delete from Cloudinary
// ============================================
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};

const ensureWalletForUser = async (userId) => {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
        try {
            wallet = await Wallet.create({
                userId,
                balance: 0,
                heldFunds: 0,
                totalDeposited: 0,
                totalSpent: 0
            });
        } catch (error) {
            if (error.code === 11000) {
                wallet = await Wallet.findOne({ userId });
            } else {
                throw error;
            }
        }
    }

    await Customer.findOneAndUpdate(
        { userId },
        { $set: { walletId: wallet._id } }
    );

    return wallet;
};

// @route   GET /api/wallet/balance
// @desc    Get user's wallet balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
    try {
        const wallet = await ensureWalletForUser(req.user.id);

        res.json({
            success: true,
            data: {
                balance: wallet.balance,
                heldFunds: wallet.heldFunds,
                totalDeposited: wallet.totalDeposited,
                totalSpent: wallet.totalSpent
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet balance',
            error: error.message
        });
    }
});

// @route   GET /api/wallet/summary
// @desc    Get wallet dashboard summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        const wallet = await ensureWalletForUser(req.user.id);

        const pendingTopups = await TopUpRequest.find({
            userId: req.user.id,
            status: 'pending'
        });

        const pendingTopupAmount = pendingTopups.reduce(
            (sum, request) => sum + (Number(request.amount) || 0),
            0
        );

        const pendingTransactions = pendingTopups.length;

        res.json({
            success: true,
            data: {
                availableBalance: wallet.balance - wallet.heldFunds,
                fundsOnHold: pendingTopupAmount,
                pendingTransactions,
                equity: wallet.totalDeposited || wallet.balance
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching wallet summary',
            error: error.message
        });
    }
});

// @route   GET /api/wallet/transactions
// @desc    Get user's top-up requests (treated as transactions)
// @access  Private
router.get('/transactions', protect, async (req, res) => {
    try {
        const { filter, page = 1, limit = 10 } = req.query;

        let query = { userId: req.user.id };

        // Apply filters
        if (filter === 'pending') {
            query.status = 'pending';
        } else if (filter === 'approved') {
            query.status = 'approved';
        } else if (filter === 'rejected') {
            query.status = 'rejected';
        }

        const total = await TopUpRequest.countDocuments(query);
        const topupRequests = await TopUpRequest.find(query)
            .populate('userId', 'name email')
            .populate('approvedBy', 'name')
            .sort({ requestedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: topupRequests,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions',
            error: error.message
        });
    }
});

// @route   GET /api/wallet/dashboard-transactions
// @desc    Get wallet dashboard transactions (for WalletDashboard.jsx)
// @access  Private
router.get('/dashboard-transactions', protect, async (req, res) => {
    try {
        const wallet = await ensureWalletForUser(req.user.id);

        const [topupRequests, walletTransactions] = await Promise.all([
            TopUpRequest.find({ userId: req.user.id })
                .populate('userId', 'name')
                .populate('approvedBy', 'name')
                .sort({ requestedAt: -1 })
                .limit(20),
            Transaction.find({
                $or: [
                    { userId: req.user.id },
                    { walletId: wallet._id }
                ]
            })
                .sort({ createdAt: -1 })
                .limit(20)
        ]);

        const formattedTopups = topupRequests.map(req => ({
            _id: req._id,
            title: `Wallet Top-Up Request`,
            description: `Top-up request - Ref: ${req.bankReference || 'N/A'}`,
            type: 'income', // Top-ups are income
            amount: req.amount,
            status: req.status,
            createdAt: req.requestedAt,
            metadata: {
                referenceNumber: req.bankReference,
                receiptUrl: req.receiptImage,
                paymentMethod: req.paymentMethod
            }
        }));

        const formattedWalletTransactions = walletTransactions.map((transaction) => ({
            _id: transaction._id,
            title: transaction.title || transaction.description || 'Wallet Transaction',
            description: transaction.description || 'Wallet activity',
            type: transaction.type === 'purchase' || transaction.type === 'withdrawal' || transaction.type === 'payment'
                ? 'expense'
                : 'income',
            amount: transaction.amount,
            status: transaction.status,
            createdAt: transaction.createdAt,
            subtitle: transaction.subtitle || transaction.type || 'Wallet activity',
            metadata: transaction.metadata || {}
        }));

        const mergedTransactions = [...formattedWalletTransactions, ...formattedTopups]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .filter((item, index, array) =>
                index === array.findIndex((candidate) => String(candidate._id) === String(item._id))
            )
            .slice(0, 20);

        res.json({
            success: true,
            data: mergedTransactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard transactions',
            error: error.message
        });
    }
});

// @route   POST /api/wallet/request-topup
// @desc    Request wallet top-up with receipt
// @access  Private
router.post('/request-topup', protect, upload.single('receipt'), async (req, res) => {
    try {
        await ensureWalletForUser(req.user.id);

        const amount = parseFloat(req.body.amount);
        const bankReference = req.body.reference || req.body.bankReference;
        const paymentMethod = req.body.paymentMethod || 'bankTransfer';

        if (!amount || !bankReference) {
            return res.status(400).json({
                success: false,
                message: 'Amount and bank reference are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt file is required'
            });
        }

        // ✅ UPLOAD RECEIPT TO CLOUDINARY
        let receiptUrl = null;

        try {
            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                'wallet/receipts',
                `${req.user.id}-${Date.now()}`
            );

            receiptUrl = uploadResult.secure_url;
            console.log('✅ Receipt uploaded to Cloudinary:', uploadResult.public_id);
        } catch (uploadError) {
            console.error('❌ Cloudinary upload error:', uploadError);
            return res.status(400).json({
                success: false,
                message: 'Failed to upload receipt to cloud storage'
            });
        }

        // ✅ CREATE TOP-UP REQUEST IN CORRECT DATABASE
        const topupRequest = await TopUpRequest.create({
            userId: req.user.id,
            amount,
            paymentMethod,
            bankReference,
            receiptImage: receiptUrl,  // ✅ Cloudinary URL
            status: 'pending'
        });

        console.log('✅ Top-up request created:', topupRequest._id);

        res.status(201).json({
            success: true,
            message: '✅ Top-up request submitted successfully. Pending admin approval.',
            data: topupRequest
        });
    } catch (error) {
        console.error('❌ Error submitting top-up request:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting top-up request',
            error: error.message
        });
    }
});

// @route   GET /api/wallet/topup-requests
// @desc    Get all top-up requests for a user
// @access  Private
router.get('/topup-requests', protect, async (req, res) => {
    try {
        const topupRequests = await TopUpRequest.find({ userId: req.user.id })
            .populate('approvedBy', 'name email')
            .sort({ requestedAt: -1 });

        res.json({
            success: true,
            data: topupRequests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching top-up requests',
            error: error.message
        });
    }
});

// @route   DELETE /api/wallet/topup-requests/:id
// @desc    Delete a top-up request (user can only delete pending ones)
// @access  Private
router.delete('/topup-requests/:id', protect, async (req, res) => {
    try {
        const topupRequest = await TopUpRequest.findById(req.params.id);

        if (!topupRequest) {
            return res.status(404).json({
                success: false,
                message: 'Top-up request not found'
            });
        }

        // Only allow user to delete their own pending requests
        if (topupRequest.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own requests'
            });
        }

        if (topupRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete approved or rejected requests'
            });
        }

        // ✅ DELETE RECEIPT FROM CLOUDINARY (if exists)
        if (topupRequest.receiptImage) {
            // Extract public_id from Cloudinary URL
            // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/ceylon-gems/wallet/receipts/filename
            const urlParts = topupRequest.receiptImage.split('/');
            const filename = urlParts[urlParts.length - 1];
            const folderPath = `ceylon-gems/wallet/receipts/${filename.split('.')[0]}`;

            await deleteFromCloudinary(folderPath);
            console.log(`✅ Deleted receipt from Cloudinary`);
        }

        // Delete from database
        await TopUpRequest.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Top-up request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting request',
            error: error.message
        });
    }
});

module.exports = router;
