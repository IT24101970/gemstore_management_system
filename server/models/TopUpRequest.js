const mongoose = require('mongoose');

const BANK_REFERENCE_REGEX = /^[A-Za-z0-9]{6,20}$/;

const topUpRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 50
    },
    paymentMethod: {
        type: String,
        enum: ['bankTransfer', 'creditCard', 'debitCard', 'mobilePayment'],
        required: true
    },
    bankReference: {
        type: String,
        trim: true,
        minlength: 6,
        maxlength: 20,
        match: [BANK_REFERENCE_REGEX, 'Bank reference must be 6-20 alphanumeric characters']
    },
    receiptImage: {
        type: String, // URL to uploaded receipt
        required: true
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
