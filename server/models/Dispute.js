const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['itemNotReceived', 'itemNotAsDescribed', 'damagedItem', 'wrongItem', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    evidence: [{
        type: String // URLs to uploaded images/documents
    }],
    status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    action: {
        type: String,
        enum: ['refund', 'release', 'partial', 'none'],
        default: 'none'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    resolution: String,
    resolutionNotes: String,
    notes: [{
        text: {
            type: String,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Dispute', disputeSchema);