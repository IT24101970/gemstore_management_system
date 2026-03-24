const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    heldFunds: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDeposited: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Virtual for available balance (balance - held funds)
walletSchema.virtual('availableBalance').get(function() {
    return this.balance - this.heldFunds;
});

module.exports = mongoose.model('Wallet', walletSchema);