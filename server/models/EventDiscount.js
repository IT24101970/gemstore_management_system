const mongoose = require('mongoose');

const eventDiscountSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gemstone',
        required: true
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EventDiscount', eventDiscountSchema);