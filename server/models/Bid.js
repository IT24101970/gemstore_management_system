const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    bidderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bidAmount: {
        type: Number,
        required: true,
        min: 0
    },
    bidTime: {
        type: Date,
        default: Date.now
    },
    isWinning: {
        type: Boolean,
        default: false
    },
    isOutbid: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for faster queries
bidSchema.index({ auctionId: 1, bidTime: -1 });
bidSchema.index({ bidderId: 1, bidTime: -1 });

module.exports = mongoose.model('Bid', bidSchema);