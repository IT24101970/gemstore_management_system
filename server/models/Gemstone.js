const mongoose = require('mongoose');

const gemstoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['Blue Sapphire', 'Padparadscha', 'Ruby', 'Yellow Sapphire', 'Emerald', 'Other'],
        required: true
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
            enum: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
            default: 'Good'
        },
        color: String,
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