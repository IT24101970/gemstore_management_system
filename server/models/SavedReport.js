const mongoose = require('mongoose');

const savedReportSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Report title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    reportType: {
        type: String,
        enum: ['revenue', 'users', 'sellers', 'gemstones', 'transactions', 'approvals', 'custom'],
        required: true
    },
    period: {
        type: String,
        enum: ['week', 'month', 'year', 'custom'],
        default: 'month'
    },
    dateRange: {
        startDate: Date,
        endDate: Date
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    }
}, {
    timestamps: true
});

// Index for faster queries
savedReportSchema.index({ adminId: 1, createdAt: -1 });
savedReportSchema.index({ reportType: 1 });
savedReportSchema.index({ status: 1 });

module.exports = mongoose.model('SavedReport', savedReportSchema);