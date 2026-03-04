const mongoose = require('mongoose');

const gemstoneSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    attributes: {
        carat: {
            type: Number,
            required: true,
            min: 0
        },
        color: String,
        clarity: String,
        cut: String,
        shape: String,
        origin: String,
        treatment: String,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
    },
    images: [{
        url: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    certifications: [{
        type: {
            type: String,
            enum: ['GIA', 'GRS', 'EGL', 'NGJA', 'Other']
        },
        certificateNumber: String,
        url: String,
        issuedDate: Date
    }],
    sellingMethod: {
        type: String,
        enum: ['instantPurchase', 'auction'],
        required: true
    },
    price: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ['available', 'underAuction', 'sold', 'removed'],
        default: 'available'
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index for search
gemstoneSchema.index({ title: 'text', description: 'text' });
gemstoneSchema.index({ sellerId: 1 });

module.exports = mongoose.model('Gemstone', gemstoneSchema);