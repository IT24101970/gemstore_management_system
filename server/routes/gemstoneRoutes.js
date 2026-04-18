const express = require('express');
const router = express.Router();
const { Gemstone, User, Auction, GemstoneApproval, Wallet, Transaction, Order, Customer } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// ============================================
// Helper function to upload to Cloudinary
// ============================================
const uploadToCloudinary = (buffer, folder, filename) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `ceylon-gems/${folder}`,
                resource_type: 'auto',
                public_id: filename
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// ============================================
// Helper function to delete from Cloudinary
// ============================================
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
    }
};

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

// @route   POST /api/gemstones/:id/purchase
// @desc    Purchase a gemstone instantly using wallet balance
// @access  Private
router.post('/:id/purchase', protect, authorize('buyer', 'seller', 'admin'), async (req, res) => {
    let walletDebited = false;

    try {
        const submittedAddress = req.body?.shippingAddress || {};
        const gemstone = await Gemstone.findById(req.params.id).populate('sellerId', 'name email');

        if (!gemstone) {
            return res.status(404).json({ success: false, message: 'Gemstone not found' });
        }

        if (gemstone.approvalStatus !== 'approved' || gemstone.status !== 'available') {
            return res.status(400).json({ success: false, message: 'This gemstone is no longer available for purchase' });
        }

        if (gemstone.sellingMethod !== 'instantPurchase') {
            return res.status(400).json({ success: false, message: 'This gemstone cannot be purchased directly' });
        }

        if (String(gemstone.sellerId?._id || gemstone.sellerId) === String(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You cannot purchase your own gemstone listing' });
        }

        const price = Number(gemstone.price) || 0;
        if (price <= 0) {
            return res.status(400).json({ success: false, message: 'This gemstone has an invalid purchase price' });
        }

        const wallet = await Wallet.findOne({ userId: req.user.id });
        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found' });
        }

        const customer = await Customer.findOne({ userId: req.user.id });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }

        const shippingAddress = {
            street: submittedAddress.street || customer.shippingAddress?.street || '',
            city: submittedAddress.city || customer.shippingAddress?.city || '',
            state: submittedAddress.state || customer.shippingAddress?.state || '',
            postalCode: submittedAddress.postalCode || customer.shippingAddress?.postalCode || '',
            country: submittedAddress.country || customer.shippingAddress?.country || 'Sri Lanka',
        };

        if (!shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({ success: false, message: 'A valid shipping address is required for purchase' });
        }

        if (wallet.balance < price) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance to complete this purchase' });
        }

        const updatedWallet = await Wallet.findOneAndUpdate(
            { userId: req.user.id, balance: { $gte: price } },
            { $inc: { balance: -price, totalSpent: price } },
            { new: true }
        );

        if (!updatedWallet) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance to complete this purchase' });
        }

        walletDebited = true;

        const soldGemstone = await Gemstone.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'available',
                approvalStatus: 'approved',
                sellingMethod: 'instantPurchase',
            },
            { status: 'sold' },
            { new: true }
        );

        if (!soldGemstone) {
            await Wallet.findOneAndUpdate(
                { userId: req.user.id },
                { $inc: { balance: price, totalSpent: -price } }
            );
            return res.status(409).json({ success: false, message: 'This gemstone was just purchased by another user' });
        }

        const order = await Order.create({
            gemId: soldGemstone._id,
            buyerId: req.user.id,
            sellerId: gemstone.sellerId?._id || gemstone.sellerId,
            totalAmount: price,
            discount: 0,
            status: 'processing',
            shippingAddress,
        });

        await Customer.findOneAndUpdate(
            { userId: req.user.id },
            { $set: { shippingAddress } }
        );

        await Transaction.create({
            walletId: updatedWallet._id,
            userId: req.user.id,
            type: 'purchase',
            amount: price,
            status: 'completed',
            relatedId: order._id,
            description: `Instant purchase for ${soldGemstone.title}`,
            title: soldGemstone.title,
            subtitle: `Purchased from ${gemstone.sellerId?.name || 'Verified Seller'}`,
            metadata: {
                gemId: soldGemstone._id,
                orderId: order._id,
                sellerId: gemstone.sellerId?._id || gemstone.sellerId,
                shippingAddress,
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Gem purchased successfully',
            data: {
                order,
                gemstone: soldGemstone,
                wallet: {
                    balance: updatedWallet.balance,
                    heldFunds: updatedWallet.heldFunds,
                    availableBalance: updatedWallet.balance - updatedWallet.heldFunds,
                    totalSpent: updatedWallet.totalSpent,
                }
            }
        });
    } catch (error) {
        if (walletDebited) {
            const gemstone = await Gemstone.findById(req.params.id).select('status price');
            if (gemstone && gemstone.status !== 'sold') {
                await Wallet.findOneAndUpdate(
                    { userId: req.user.id },
                    { $inc: { balance: Number(gemstone.price) || 0, totalSpent: -(Number(gemstone.price) || 0) } }
                );
            }
        }

        console.error('Error purchasing gemstone:', error);
        return res.status(500).json({ success: false, message: 'Error completing gemstone purchase', error: error.message });
    }
});

// @route   POST /api/gemstones
// @desc    Create a new gemstone listing
// @access  Private (Sellers only)
router.post('/', protect, authorize('seller', 'admin'), upload.fields([{ name: "images", maxCount: 3 }, { name: "report", maxCount: 1 }]), async (req, res) => {
    try {
        let {
            title,
            type,
            description,
            attributes,
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
                console.error('Error parsing attributes:', e);
            }
        }

        // ✅ UPLOAD IMAGES TO CLOUDINARY
        let images = [];
        if (req.files && req.files.images && req.files.images.length > 0) {
            try {
                const uploadPromises = req.files.images.map((file, idx) =>
                    uploadToCloudinary(
                        file.buffer,
                        'gemstones/listings',
                        `${req.user.id}-${Date.now()}-${idx}`
                    )
                );

                const uploadedImages = await Promise.all(uploadPromises);

                images = uploadedImages.map((result, idx) => ({
                    url: result.secure_url,
                    publicId: result.public_id,
                    isPrimary: idx === 0
                }));

                console.log('✅ Images uploaded to Cloudinary:', images.length);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload images to cloud storage'
                });
            }
        }

        // ✅ UPLOAD REPORT TO CLOUDINARY
        let reportFile = null;
        let reportPublicId = null;
        if (req.files && req.files.report && req.files.report.length > 0) {
            try {
                const reportUpload = await uploadToCloudinary(
                    req.files.report[0].buffer,
                    'gemstones/reports',
                    `${req.user.id}-${Date.now()}`
                );
                reportFile = reportUpload.secure_url;
                reportPublicId = reportUpload.public_id;
                console.log('✅ Report uploaded to Cloudinary');
            } catch (uploadError) {
                console.error('❌ Cloudinary report upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload report to cloud storage'
                });
            }
        }

        // Validation
        if (!title || !description || !attributes || images.length === 0 || !sellingMethod) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields (title, description, attributes, at least one image, sellingMethod)'
            });
        }

        if (!reportFile) {
            return res.status(400).json({
                success: false,
                message: 'Laboratory certificate (report) is required'
            });
        }

        // ✅ CREATE GEMSTONE WITH reportPublicId
        const gemstone = await Gemstone.create({
            sellerId: req.user.id,
            title,
            type: type || 'Other',
            description,
            attributes,
            images: images || [],
            certifications: certifications || [],
            report: reportFile || null,
            reportPublicId: reportPublicId || null,
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

// @route   PUT /api/gemstones/:id
// @desc    Update gemstone listing
// @access  Private (Sellers only)
router.put('/:id', protect, authorize('seller', 'admin'), upload.fields([{ name: "images", maxCount: 3 }, { name: "report", maxCount: 1 }]), async (req, res) => {
    try {
        const existingGemstone = await Gemstone.findById(req.params.id);
        if (!existingGemstone) {
            return res.status(404).json({ success: false, message: "Gemstone not found" });
        }

        let updateData = {
            ...req.body,
            status: 'available',
            approvalStatus: "pending"
        };

        if (typeof updateData.attributes === 'string') {
            try {
                updateData.attributes = JSON.parse(updateData.attributes);
            } catch (e) {
                console.error('Error parsing attributes:', e);
            }
        }

        // ============================================
        // PROCESS RETAINED IMAGES
        // ============================================
        let retainedImages = [];
        if (req.body.retainedImages) {
            try {
                retainedImages = JSON.parse(req.body.retainedImages);
            } catch (e) {
                retainedImages = Array.isArray(req.body.retainedImages) ? req.body.retainedImages : [req.body.retainedImages];
            }
        }

        // Delete discarded images from Cloudinary
        if (existingGemstone.images && existingGemstone.images.length > 0) {
            for (const img of existingGemstone.images) {
                if (img.publicId && !retainedImages.includes(img.url)) {
                    await deleteFromCloudinary(img.publicId);
                    console.log(`✅ Deleted image from Cloudinary: ${img.publicId}`);
                }
            }
        }

        // Rebuild final images array
        let finalImages = existingGemstone.images
            ? existingGemstone.images.filter(img => retainedImages.includes(img.url))
            : [];

        // ✅ UPLOAD NEW IMAGES TO CLOUDINARY
        if (req.files && req.files.images && req.files.images.length > 0) {
            try {
                const uploadPromises = req.files.images.map((file, idx) =>
                    uploadToCloudinary(
                        file.buffer,
                        'gemstones/listings',
                        `${req.user.id}-${Date.now()}-${idx}`
                    )
                );

                const uploadedImages = await Promise.all(uploadPromises);

                const newImages = uploadedImages.map((result) => ({
                    url: result.secure_url,
                    publicId: result.public_id,
                    isPrimary: false
                }));

                finalImages = [...finalImages, ...newImages];
                console.log('✅ New images uploaded to Cloudinary:', newImages.length);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload images to cloud storage'
                });
            }
        }

        if (finalImages.length > 0 && !finalImages.some(img => img.isPrimary)) {
            finalImages[0].isPrimary = true;
        }
        updateData.images = finalImages;

        // ============================================
        // PROCESS CERTIFICATE REPORT
        // ============================================
        let retainReport = req.body.retainReport === 'true';

        if (req.files && req.files.report && req.files.report.length > 0) {
            // New report uploaded, delete old from Cloudinary if it exists
            if (existingGemstone.reportPublicId) {
                await deleteFromCloudinary(existingGemstone.reportPublicId);
                console.log(`✅ Deleted old report from Cloudinary: ${existingGemstone.reportPublicId}`);
            }

            // ✅ UPLOAD NEW REPORT TO CLOUDINARY
            try {
                const reportUpload = await uploadToCloudinary(
                    req.files.report[0].buffer,
                    'gemstones/reports',
                    `${req.user.id}-${Date.now()}`
                );
                updateData.report = reportUpload.secure_url;
                updateData.reportPublicId = reportUpload.public_id;
                console.log('✅ New report uploaded to Cloudinary');
            } catch (uploadError) {
                console.error('❌ Cloudinary report upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload report to cloud storage'
                });
            }
        } else if (!retainReport && existingGemstone.report && existingGemstone.reportPublicId) {
            // Explicitly removed report with no replacement
            await deleteFromCloudinary(existingGemstone.reportPublicId);
            console.log(`✅ Deleted report from Cloudinary: ${existingGemstone.reportPublicId}`);
            updateData.report = null;
            updateData.reportPublicId = null;
        } else {
            // Retained report - keep the existing report and publicId
            updateData.report = existingGemstone.report;
            updateData.reportPublicId = existingGemstone.reportPublicId;
        }

        const updatedGemstone = await Gemstone.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        // Clear GemstoneApproval tracker
        await GemstoneApproval.findOneAndDelete({ gemId: req.params.id });

        res.json({
            success: true,
            message: 'Gemstone updated successfully! Pending admin approval.',
            data: updatedGemstone
        });
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

        // ✅ DELETE IMAGES FROM CLOUDINARY
        if (gemstone.images && gemstone.images.length > 0) {
            for (const img of gemstone.images) {
                if (img.publicId) {
                    await deleteFromCloudinary(img.publicId);
                    console.log(`✅ Deleted image from Cloudinary: ${img.publicId}`);
                }
            }
        }

        // ✅ DELETE REPORT FROM CLOUDINARY
        if (gemstone.reportPublicId) {
            await deleteFromCloudinary(gemstone.reportPublicId);
            console.log(`✅ Deleted report from Cloudinary: ${gemstone.reportPublicId}`);
        }

        await Gemstone.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Gemstone and files deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
