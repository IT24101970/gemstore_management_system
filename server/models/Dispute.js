const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
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
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    resolution: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Dispute', disputeSchema);