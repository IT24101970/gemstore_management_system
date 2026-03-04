const mongoose = require('mongoose');

const gemstoneApprovalSchema = new mongoose.Schema({
    gemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gemstone',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        required: true
    },
    rejectionReason: String,
    reviewedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GemstoneApproval', gemstoneApprovalSchema);