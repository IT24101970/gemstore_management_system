const express = require('express');
const router = express.Router();
const { Wallet, Transaction, User } = require('../models');
const { protect } = require('../middleware/auth');

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
            .skip((page - 1) * limit)
            .populate('relatedGemId', 'title')
            .populate('relatedAuctionId');

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

// @route   POST /api/wallet/request-topup
// @desc    Request wallet top-up
// @access  Private
router.post('/request-topup', protect, async (req, res) => {
    try {
        const { amount, referenceNumber, receiptUrl } = req.body;

        if (!amount || !referenceNumber) {
            return res.status(400).json({
                success: false,
                message: 'Amount and reference number are required'
            });
        }

        const wallet = await Wallet.findOne({ userId: req.user.id });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }

        // Create pending transaction
        const transaction = await Transaction.create({
            walletId: wallet._id,
            type: 'deposit',
            amount: parseFloat(amount),
            status: 'pending',
            description: `Wallet top-up request - Ref: ${referenceNumber}`,
            metadata: {
                referenceNumber,
                receiptUrl: receiptUrl || null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Top-up request submitted successfully. Pending admin approval.',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting top-up request',
            error: error.message
        });
    }
});

module.exports = router;