const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['exhibition', 'auction', 'seminar', 'workshop', 'trade_show'],
        required: true
    },
    images: [{
        url: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    location: {
        address: {
            type: String,
            required: true
        },
        lat: Number,
        lng: Number
    },
    discountPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming'
    },
    maxAttendees: Number,
    currentAttendees: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
    if (!this.maxAttendees) return false;
    return this.currentAttendees >= this.maxAttendees;
});

module.exports = mongoose.model('Event', eventSchema);