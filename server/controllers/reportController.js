const Report = require('../models/Report');

// ── POST /api/reports
// Submit a new problem report (authenticated user)
const submitReport = async (req, res) => {
    try {
        const { category, subject, description, priority } = req.body;

        // Basic validation
        if (!category || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Category, subject, and description are all required.'
            });
        }

        if (description.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters.'
            });
        }

        const report = await Report.create({
            user: req.user.id,
            category,
            subject: subject.trim(),
            description: description.trim(),
            priority: priority || 'medium'
        });

        return res.status(201).json({
            success: true,
            message: 'Report submitted successfully.',
            data: report
        });
    } catch (err) {
        console.error('submitReport error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again.'
        });
    }
};

// ── GET /api/reports/my-reports
// Get all reports submitted by the logged-in user
const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select('category subject priority status createdAt adminNote resolvedAt');

        return res.status(200).json({
            success: true,
            data: reports
        });
    } catch (err) {
        console.error('getMyReports error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch reports.'
        });
    }
};

// ── GET /api/reports/:id
// Get a single report by ID (owner or admin only)
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('user', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }

        // Only the owner or an admin can view
        const isOwner = report.user._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        console.error('getReportById error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── GET /api/reports  (admin only)
// Get all reports with optional filters: status, priority, category
const getAllReports = async (req, res) => {
    try {
        const { status, priority, category, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status)   filter.status   = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('user', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Report.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error('getAllReports error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── PUT /api/reports/:id/status  (admin only)
// Update the status and optionally add an admin note
const updateReportStatus = async (req, res) => {
    try {
        const { status, adminNote } = req.body;

        const validStatuses = ['open', 'inprogress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const update = { status };
        if (adminNote !== undefined) update.adminNote = adminNote.trim();
        if (status === 'resolved') update.resolvedAt = new Date();

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        ).populate('user', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Report status updated.',
            data: report
        });
    } catch (err) {
        console.error('updateReportStatus error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── DELETE /api/reports/:id  (admin only)
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }
        return res.status(200).json({ success: true, message: 'Report deleted.' });
    } catch (err) {
        console.error('deleteReport error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
    submitReport,
    getMyReports,
    getReportById,
    getAllReports,
    updateReportStatus,
    deleteReport
};