const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['payment', 'order', 'account', 'listing', 'auction', 'seller', 'technical', 'other']
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: [120, 'Subject cannot exceed 120 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            minlength: [20, 'Description must be at least 20 characters'],
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['open', 'inprogress', 'resolved', 'closed'],
            default: 'open'
        },
        adminNote: {
            type: String,
            trim: true,
            default: ''
        },
        resolvedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);