const mongoose = require('mongoose');

const auctionHistorySchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    action: {
        type: String,
        enum: ['created', 'bid_placed', 'extended', 'ended', 'cancelled', 'winner_selected'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuctionHistory', auctionHistorySchema);