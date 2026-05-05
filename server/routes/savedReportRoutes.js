const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createReport,
    getReports,
    getReportById,
    updateReport,
    deleteReport,
    refreshReport,
    exportReport
} = require('../controllers/savedReportController');

// All routes require admin authentication
router.use(protect, authorize('admin'));

router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);
router.post('/:id/refresh', refreshReport);
router.get('/:id/export', exportReport);

module.exports = router;