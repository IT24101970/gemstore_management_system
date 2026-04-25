const express = require('express');
const router = express.Router();
const {
    submitReport,
    getMyReports,
    getReportById,
    getAllReports,
    updateReportStatus,
    deleteReport
} = require('../controllers/reportController');

// Middleware — import these from wherever you define them in your project
const { protect, authorize  } = require('../middleware/auth');

// ── User routes (authenticated) ──────────────────────────────
// POST   /api/reports              → submit a new report
// GET    /api/reports/my-reports   → get current user's reports
// GET    /api/reports/:id          → get one report (owner or authorize )

router.post('/',            protect, submitReport);
router.get('/my-reports',   protect, getMyReports);
router.get('/:id',          protect, getReportById);

// ── Admin routes ─────────────────────────────────────────────
// GET    /api/reports              → get all reports (with filters)
// PUT    /api/reports/:id/status   → update status + authorize  note
// DELETE /api/reports/:id          → delete a report

router.get('/',                     protect, authorize , getAllReports);
router.put('/:id/status',           protect, authorize , updateReportStatus);
router.delete('/:id',               protect, authorize , deleteReport);

module.exports = router;