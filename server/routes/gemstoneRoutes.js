const express = require('express');
const router = express.Router();
const { Gemstone, User, Auction, GemstoneApproval } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// @route   GET /api/gemstones
// @desc    Get all gemstones (featured)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const gemstones = await Gemstone.find({
            status: 'available',
            approvalStatus: 'approved'
        })
            .populate('sellerId', 'name email')
            .limit(6)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching gemstones',
            error: error.message
        });
    }
});

// @route   GET /api/gemstones/search
// @desc    Search gemstones with filters
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { keyword, type, carat, priceMin, priceMax } = req.query;

        let query = {
            status: 'available',
            approvalStatus: 'approved'
        };

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (type && type !== 'All Types') {
            query.title = { $regex: type, $options: 'i' };
        }

        if (carat) {
            const [min, max] = carat.split('-').map(v => parseFloat(v));
            if (max) {
                query['attributes.carat'] = { $gte: min, $lte: max };
            } else {
                query['attributes.carat'] = { $gte: min };
            }
        }

        if (priceMin || priceMax) {
            query.price = {};
            if (priceMin) query.price.$gte = parseFloat(priceMin);
            if (priceMax) query.price.$lte = parseFloat(priceMax);
        }

        const gemstones = await Gemstone.find(query)
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching gemstones',
            error: error.message
        });
    }
});

// ==============================
// (Moved downwards)

// @route   GET /api/gemstones/seller/my-listings
// @desc    Get all gemstones for logged in seller
// @access  Private
router.get('/seller/my-listings', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const gemstones = await Gemstone.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: gemstones.length,
            data: gemstones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching your listings',
            error: error.message
        });
    }
});

// @route   GET /api/gemstones/:id
// @desc    Get single gemstone by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const gemstone = await Gemstone.findById(req.params.id)
            .populate('sellerId', 'name email');
            
        if (!gemstone) {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }

        if (gemstone.approvalStatus !== 'approved' && gemstone.status !== 'sold') {
            return res.status(403).json({ success: false, message: 'This gemstone is not available for public view' });
        }

        res.json({
            success: true,
            data: gemstone
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/gemstones
// @desc    Create a new gemstone listing
// @access  Private (Sellers only)
router.post('/', protect, authorize('seller', 'admin'), upload.fields([{ name: "images", maxCount: 5 }, { name: "report", maxCount: 1 }]), async (req, res) => {
    try {
        let {
            title,
            type,
            description,
            attributes,
            images,
            certifications,
            sellingMethod,
            price,
            auctionDetails
        } = req.body;

        // Ensure attributes is an object
        if (typeof attributes === 'string') {
            try {
                attributes = JSON.parse(attributes);
            } catch (e) {
                // Ignore parse error
            }
        }

        // Handle uploaded images from Multer
        if (req.files && req.files.images) {
            images = req.files.images.map(file => ({ url: file.filename, isPrimary: false }));
            if (images.length > 0) images[0].isPrimary = true;
        }

        // Handle report
        let reportFile = null;
        if (req.files && req.files.report) {
            reportFile = req.files.report[0].filename;
        }

        // Validation
        if (!title || !description || !attributes || !images || !sellingMethod) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image is required'
            });
        }

        // Create gemstone
        const gemstone = await Gemstone.create({
            sellerId: req.user.id,
            title,
            type: type || 'Other',
            description,
            attributes,
            images: images || [],
            certifications: certifications || [],
            report: reportFile || null,
            sellingMethod,
            price: sellingMethod === 'instantPurchase' ? parseFloat(price) : null,
            status: 'available',
            approvalStatus: 'pending'
        });

        // If auction, create auction record
        if (sellingMethod === 'auction') {
            await Auction.create({
                gemId: gemstone._id,
                sellerId: req.user.id,
                startPrice: auctionDetails.startPrice,
                currentPrice: auctionDetails.startPrice,
                minIncrement: auctionDetails.minIncrement,
                reservePrice: auctionDetails.reservePrice || null,
                startTime: auctionDetails.startTime,
                endTime: auctionDetails.endTime,
                status: new Date(auctionDetails.startTime) <= new Date() ? 'active' : 'scheduled',
                totalBids: 0
            });
        }

        res.status(201).json({
            success: true,
            message: 'Gemstone listing created successfully! Pending admin approval.',
            data: gemstone
        });

    } catch (error) {
        console.error('Error creating gemstone:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating gemstone listing',
            error: error.message
        });
    }
});

module.exports = router;

// @route   PUT /api/gemstones/:id
// @desc    Update gemstone listing
// @access  Private (Sellers only)
router.put('/:id', protect, authorize('seller', 'admin'), upload.fields([{ name: "images", maxCount: 3 }, { name: "report", maxCount: 1 }]), async (req, res) => {
    try {
        const existingGemstone = await Gemstone.findById(req.params.id);
        if (!existingGemstone) return res.status(404).json({ success: false, message: "Gemstone not found" });

        let updateData = { 
            ...req.body,
            status: 'available',
            approvalStatus: "pending" // Force back to pending on edit
        };

        if (typeof updateData.attributes === 'string') {
            try { updateData.attributes = JSON.parse(updateData.attributes); } catch (e) {}
        }

        // 1. Process Retained Images
        let retainedImages = [];
        if (req.body.retainedImages) {
            try {
                retainedImages = JSON.parse(req.body.retainedImages);
            } catch (e) {
                retainedImages = Array.isArray(req.body.retainedImages) ? req.body.retainedImages : [req.body.retainedImages];
            }
        }

        // Delete discarded images from filesystem
        if (existingGemstone.images) {
            existingGemstone.images.forEach(img => {
                if (img.url && !retainedImages.includes(img.url)) {
                    const imgPath = path.join(__dirname, "../uploads", img.url);
                    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                }
            });
        }

        // Rebuild final images array
        let finalImages = existingGemstone.images ? existingGemstone.images.filter(img => retainedImages.includes(img.url)) : [];

        if (req.files && req.files.images) {
            const newImages = req.files.images.map(file => ({ url: file.filename, isPrimary: false }));
            finalImages = [...finalImages, ...newImages];
        }

        if (finalImages.length > 0 && !finalImages.some(img => img.isPrimary)) {
            finalImages[0].isPrimary = true;
        }
        updateData.images = finalImages;

        // 2. Process Certificate Report
        let retainReport = req.body.retainReport === 'true';
        
        if (req.files && req.files.report) {
            // New report uploaded, delete old
            if (existingGemstone.report) {
                const reportPath = path.join(__dirname, "../uploads", existingGemstone.report);
                if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
            }
            updateData.report = req.files.report[0].filename;
        } else if (!retainReport && existingGemstone.report) {
            // Explicitly removed report with no replacement
            const reportPath = path.join(__dirname, "../uploads", existingGemstone.report);
            if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
            updateData.report = null;
        } else {
            // Retained report
            updateData.report = existingGemstone.report;
        }

        const updatedGemstone = await Gemstone.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        // Explicitly clear any existing Admin shadow tracker so it re-appears dynamically in "Pending" queues
        await GemstoneApproval.findOneAndDelete({ gemId: req.params.id });

        res.json({ success: true, data: updatedGemstone });
    } catch (error) {
        console.error("PUT Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/gemstones/:id
// @desc    Delete gemstone listing
// @access  Private (Sellers only)
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const gemstone = await Gemstone.findById(req.params.id);
        if (!gemstone) {
            return res.status(404).json({ success: false, message: "Gemstone not found" });
        }

        if (gemstone.images && gemstone.images.length > 0) {
            gemstone.images.forEach((img) => {
                if(img.url) {
                    const imgPath = path.join(__dirname, "../uploads", img.url);
                    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                }
            });
        }

        if (gemstone.report) {
            const reportPath = path.join(__dirname, "../uploads", gemstone.report);
            if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);
        }

        await Gemstone.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Gemstone and files deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});