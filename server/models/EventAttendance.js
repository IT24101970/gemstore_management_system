const mongoose = require('mongoose');

const eventAttendanceSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    attended: {
        type: Boolean,
        default: false
    },
    attendanceCode: {
        type: String,
        unique: true,
        sparse: true
    },
    checkedInAt: Date
}, {
    timestamps: true
});

// Compound index to ensure one registration per user per event
eventAttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// Generate unique attendance code before saving - UPDATED
eventAttendanceSchema.pre('save', function() {
    if (!this.attendanceCode) {
        this.attendanceCode = `EVT-${this.eventId.toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
});

module.exports = mongoose.model('EventAttendance', eventAttendanceSchema);