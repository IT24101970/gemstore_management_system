const mongoose = require('mongoose');

const topUpRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    paymentMethod: {
        type: String,
        enum: ['bankTransfer', 'creditCard', 'debitCard', 'mobilePayment'],
        required: true
    },
    bankReference: {
        type: String,
        trim: true
    },
    receiptImage: {
        type: String // URL to uploaded receipt
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
}, {
    timestamps: true
});

module.exports = mongoose.model('TopUpRequest', topUpRequestSchema);