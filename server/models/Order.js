const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    gemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gemstone',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    eventDiscountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EventDiscount'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    trackingNumber: String,
    status: {
        type: String,
        enum: ['paymentPending', 'processing', 'shipped', 'delivered', 'disputed', 'completed', 'cancelled'],
        default: 'paymentPending'
    }
}, {
    timestamps: true
});

// Index for queries
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);