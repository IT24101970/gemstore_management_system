const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    gemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gemstone',
        required: true,
        unique: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startPrice: {
        type: Number,
        required: true,
        min: 0
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    minIncrement: {
        type: Number,
        required: true,
        min: 1
    },
    reservePrice: {
        type: Number,
        min: 0
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled'],
        default: 'scheduled'
    },
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    totalBids: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Validate end time is after start time - UPDATED
auctionSchema.pre('save', function() {
    if (this.endTime <= this.startTime) {
        throw new Error('End time must be after start time');
    }
});

module.exports = mongoose.model('Auction', auctionSchema);