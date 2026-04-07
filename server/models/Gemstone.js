const mongoose = require('mongoose');

const gemstoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Sapphire', 'Padparadscha', 'Ruby', 'Emerald', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    attributes: {
        carat: {
            type: Number,
            required: true
        },
        cut: {
            type: String,
            default: 'Good'
        },
        color: String,
        colorIntensity: String,
        shape: String,
        clarity: String,
        origin: String
    },
    certifications: [
        {
            name: String,
            number: String,
            url: String
        }
    ],
    images: [
        {
            url: String,
            isPrimary: {
                type: Boolean,
                default: false
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'underAuction', 'sold', 'delisted'],
        default: 'available'
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    report: {
        type: String
    },
    sellingMethod: {
        type: String,
        enum: ['instantPurchase', 'auction'],
        default: 'instantPurchase'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Gemstone', gemstoneSchema);