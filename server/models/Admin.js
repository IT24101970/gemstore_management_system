const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    permissions: [{
        type: String,
        enum: [
            'approveSellerVerification',
            'approveGemstoneListings',
            'approveWalletTopUps',
            'monitorTransactions',
            'handleDisputes',
            'generateReports',
            'manageUsers',
            'manageEvents'
        ]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);