const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        trim: true
        // Optional - not required
    },
    businessRegistration: {
        type: String,
        trim: true
        // Optional - not required
    },
    verificationDocuments: [{
        type: {
            type: String,
            required: true,
            enum: ['businessRegistration', 'nationalID', 'other']
        },
        url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    rejectionReason: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Seller', sellerSchema);