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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        default: ''
    },
    endTime: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['exhibition', 'auction', 'seminar', 'workshop', 'trade_show'],
        required: true
    },
    images: [{
        url: String,
        publicId: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    location: {
        city: {
            type: String,
            required: true
        },
        venue: {
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
    discountDescription: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['upcoming', 'active', 'ended', 'inactive'],
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

eventSchema.virtual('isFull').get(function() {
    if (!this.maxAttendees) return false;
    return this.currentAttendees >= this.maxAttendees;
});


module.exports = mongoose.model('Event', eventSchema);