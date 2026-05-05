const SavedReport = require('../models/SavedReport');
const { Transaction, User, Seller, Gemstone, GemstoneApproval } = require('../models');

// ── POST /api/admin/saved-reports
// Save a new report snapshot
const createReport = async (req, res) => {
    try {
        const { title, description, reportType, period, dateRange, tags, data } = req.body;

        if (!title || !reportType || !data) {
            return res.status(400).json({
                success: false,
                message: 'Title, reportType, and data are required'
            });
        }

        const report = await SavedReport.create({
            adminId: req.user.id,
            title: title.trim(),
            description: description?.trim() || '',
            reportType,
            period: period || 'month',
            dateRange: dateRange || { startDate: null, endDate: null },
            data,
            tags: tags || [],
            status: 'published'
        });

        res.status(201).json({
            success: true,
            message: 'Report saved successfully',
            data: report
        });
    } catch (error) {
        console.error('Error creating saved report:', error);
        res.status(500).json({ success: false, message: 'Failed to save report', error: error.message });
    }
};

// ── GET /api/admin/saved-reports
// Get all saved reports for the admin
const getReports = async (req, res) => {
    try {
        const { reportType, status, search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

        const filter = {};

        if (reportType && reportType !== 'all') {
            filter.reportType = reportType;
        }

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [reports, total] = await Promise.all([
            SavedReport.find(filter)
                .populate('adminId', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .select('-data'),
            SavedReport.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching saved reports:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reports', error: error.message });
    }
};

// ── GET /api/admin/saved-reports/:id
// Get a single saved report with full data
const getReportById = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id)
            .populate('adminId', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        console.error('Error fetching saved report:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch report', error: error.message });
    }
};

// ── PUT /api/admin/saved-reports/:id
// Update a saved report
const updateReport = async (req, res) => {
    try {
        const { title, description, tags, status } = req.body;

        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (title !== undefined) report.title = title.trim();
        if (description !== undefined) report.description = description.trim();
        if (tags !== undefined) report.tags = tags;
        if (status !== undefined) {
            const validStatuses = ['draft', 'published', 'archived'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${validStatuses.join(', ')}`
                });
            }
            report.status = status;
        }

        await report.save();

        res.json({
            success: true,
            message: 'Report updated successfully',
            data: report
        });
    } catch (error) {
        console.error('Error updating saved report:', error);
        res.status(500).json({ success: false, message: 'Failed to update report', error: error.message });
    }
};

// ── DELETE /api/admin/saved-reports/:id
// Delete a saved report
const deleteReport = async (req, res) => {
    try {
        const report = await SavedReport.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting saved report:', error);
        res.status(500).json({ success: false, message: 'Failed to delete report', error: error.message });
    }
};

// ── POST /api/admin/saved-reports/:id/refresh
// Refresh report data (re-fetch analytics for same filters)
const refreshReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        // Re-fetch data based on report type and date range
        const startDate = report.dateRange?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
        const endDate = report.dateRange?.endDate || new Date();

        let freshData = {};

        if (report.reportType === 'revenue' || report.reportType === 'transactions') {
            const summary = await Transaction.aggregate([
                { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                {
                    $group: {
                        _id: null,
                        totalVolume: { $sum: '$amount' },
                        totalCount: { $sum: 1 },
                        avgValue: { $avg: '$amount' }
                    }
                }
            ]);
            freshData = summary[0] || { totalVolume: 0, totalCount: 0, avgValue: 0 };
        }

        if (report.reportType === 'users') {
            freshData.totalUsers = await User.countDocuments({
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
            });
        }

        if (report.reportType === 'sellers') {
            freshData.totalSellers = await Seller.countDocuments();
            freshData.approvedSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
            freshData.pendingSellers = await Seller.countDocuments({ verificationStatus: 'pending' });
        }

        if (report.reportType === 'gemstones' || report.reportType === 'approvals') {
            freshData.totalGemstones = await Gemstone.countDocuments();
            freshData.approvedGemstones = await Gemstone.countDocuments({ approvalStatus: 'approved' });
            freshData.pendingGemstones = await Gemstone.countDocuments({ approvalStatus: 'pending' });
        }

        report.data = { ...report.data, refreshedData: freshData, refreshedAt: new Date() };
        await report.save();

        res.json({
            success: true,
            message: 'Report data refreshed successfully',
            data: report
        });
    } catch (error) {
        console.error('Error refreshing report:', error);
        res.status(500).json({ success: false, message: 'Failed to refresh report', error: error.message });
    }
};

// ── GET /api/admin/saved-reports/:id/export
// Export report as JSON
const exportReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id)
            .populate('adminId', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.json`);
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ success: false, message: 'Failed to export report', error: error.message });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    updateReport,
    deleteReport,
    refreshReport,
    exportReport
};