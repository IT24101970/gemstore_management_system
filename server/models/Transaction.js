const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['topUp', 'purchase', 'auctionBid', 'auctionWin', 'auctionRefund', 'sellerPayout'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pendingAdminApproval', 'hold', 'completed', 'failed', 'refunded'],
        default: 'pendingAdminApproval'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceType'
    },
    referenceType: {
        type: String,
        enum: ['Order', 'Auction', 'Bid', 'TopUpRequest']
    },
    adminNotes: String,
    time: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
transactionSchema.index({ walletId: 1, time: -1 });
transactionSchema.index({ userId: 1, time: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);