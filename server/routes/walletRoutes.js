const express = require('express');
const multer = require('multer');
const router = express.Router();
const { Wallet, Transaction, User } = require('../models');
const { protect } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

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

// @route   GET /api/wallet/balance
// @desc    Get user's wallet balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

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
        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const pendingTransactions = await Transaction.countDocuments({
            walletId: wallet._id,
            status: 'pending'
        });

        res.json({
            success: true,
            data: {
                availableBalance: wallet.balance - wallet.heldFunds,
                fundsOnHold: wallet.heldFunds,
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
// @desc    Get user's transactions
// @access  Private
router.get('/transactions', protect, async (req, res) => {
    try {
        const { filter, page = 1, limit = 10 } = req.query;

        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        let query = { walletId: wallet._id };

        // Apply filters
        if (filter === 'income') {
            query.type = { $in: ['deposit', 'refund', 'sale'] };
        } else if (filter === 'expense') {
            query.type = { $in: ['purchase', 'bid', 'withdrawal', 'fee'] };
        }

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            data: transactions,
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
        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        const transactions = await Transaction.find({ walletId: wallet._id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to last 20 transactions

        res.json({
            success: true,
            data: transactions
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
        const amount = parseFloat(req.body.amount);
        const referenceNumber = req.body.reference || req.body.referenceNumber;

        if (!amount || !referenceNumber) {
            return res.status(400).json({
                success: false,
                message: 'Amount and reference number are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Receipt file is required'
            });
        }

        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // ✅ UPLOAD RECEIPT TO CLOUDINARY
        let receiptUrl = null;
        let receiptPublicId = null;

        try {
            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                'wallet/receipts',
                `${req.user.id}-${Date.now()}`
            );

            receiptUrl = uploadResult.secure_url;
            receiptPublicId = uploadResult.public_id;

            console.log('✅ Receipt uploaded to Cloudinary:', receiptPublicId);
        } catch (uploadError) {
            console.error('❌ Cloudinary upload error:', uploadError);
            return res.status(400).json({
                success: false,
                message: 'Failed to upload receipt to cloud storage'
            });
        }

        // Create transaction with Cloudinary receipt URL
        const transaction = await Transaction.create({
            walletId: wallet._id,
            userId: req.user.id,
            type: 'deposit',
            amount,
            status: 'pending',
            description: `Wallet top-up request - Ref: ${referenceNumber}`,
            metadata: {
                referenceNumber,
                receiptUrl,        // ✅ Cloudinary URL
                receiptPublicId,   // ✅ For deletion later
                receiptFileName: req.file.originalname
            }
        });

        res.status(201).json({
            success: true,
            message: '✅ Top-up request submitted successfully. Pending admin approval.',
            data: transaction
        });
    } catch (error) {
        console.error('Error submitting top-up request:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting top-up request',
            error: error.message
        });
    }
});

// @route   DELETE /api/wallet/request-topup/:id
// @desc    Delete a top-up request (admin only)
// @access  Private
router.delete('/request-topup/:id', protect, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // ✅ DELETE RECEIPT FROM CLOUDINARY
        if (transaction.metadata?.receiptPublicId) {
            await deleteFromCloudinary(transaction.metadata.receiptPublicId);
            console.log(`✅ Deleted receipt from Cloudinary: ${transaction.metadata.receiptPublicId}`);
        }

        // Delete transaction from database
        await Transaction.findByIdAndDelete(req.params.id);

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