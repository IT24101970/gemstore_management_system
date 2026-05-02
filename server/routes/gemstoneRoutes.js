const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Gemstone, User, Auction, GemstoneApproval, Wallet, Transaction, Order, Customer, Event } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { sendEmail } = require('../services/emailService')

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


// Helper function to upload to Cloudinary
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


// Helper function to delete from Cloudinary
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
        const currentDate = new Date();

        const activeEvent = await Event.findOne({
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            discountPercentage: { $gt: 0 }
        }).sort({ createdAt: -1 });

        const gemstoneData = gemstone.toObject();
        gemstoneData.activeEventDiscountPercentage = activeEvent ? activeEvent.discountPercentage : 0;

        res.json({
            success: true,
            data: gemstoneData
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
    let session = null;

    try {
        session = await mongoose.startSession();
        let responsePayload = null;

        await session.withTransaction(async () => {
            const submittedAddress = req.body?.shippingAddress || {};
            const gemstone = await Gemstone.findById(req.params.id)
                .populate('sellerId', 'name email')
                .session(session);

        if (!gemstone) {
            throw new Error('Gemstone not found');
        }

        if (gemstone.approvalStatus !== 'approved' || gemstone.status !== 'available') {
            throw new Error('This gemstone is no longer available for purchase');
        }

        if (gemstone.sellingMethod !== 'instantPurchase') {
            throw new Error('This gemstone cannot be purchased directly');
        }

        if (String(gemstone.sellerId?._id || gemstone.sellerId) === String(req.user.id)) {
            throw new Error('You cannot purchase your own gemstone listing');
        }

        const originalPrice = Number(gemstone.price) || 0;
        if (originalPrice <= 0) {
            throw new Error('This gemstone has an invalid purchase price');
        }

            // Find active event. Give priority to an event with discount.
            const currentDate = new Date();

            let activeEvent = await Event.findOne({
                startDate: { $lte: currentDate },
                endDate: { $gte: currentDate },
                discountPercentage: { $gt: 0 }
            }).sort({ discountPercentage: -1, createdAt: -1 }).session(session);

            if (!activeEvent) {
                activeEvent = await Event.findOne({
                    startDate: { $lte: currentDate },
                    endDate: { $gte: currentDate }
                }).sort({ createdAt: -1 }).session(session);
            }


        let discount = 0;
        let finalPrice = originalPrice;

            if (activeEvent && activeEvent.discountPercentage > 0) {
                discount = (originalPrice * activeEvent.discountPercentage) / 100;
                finalPrice = originalPrice - discount;
            }

        // Customer profile is optional — sellers may not have one
        const customer = await Customer.findOne({ userId: req.user.id }).session(session);

        const shippingAddress = {
            street: submittedAddress.street || customer?.shippingAddress?.street || '',
            city: submittedAddress.city || customer?.shippingAddress?.city || '',
            state: submittedAddress.state || customer?.shippingAddress?.state || '',
            postalCode: submittedAddress.postalCode || customer?.shippingAddress?.postalCode || '',
            country: submittedAddress.country || customer?.shippingAddress?.country || 'Sri Lanka',
        };

        if (!shippingAddress.street || !shippingAddress.city) {
            throw new Error('A valid shipping address is required for purchase');
        }

        let buyerWallet = await Wallet.findOne({ userId: req.user.id }).session(session);
        if (!buyerWallet) {
            buyerWallet = await Wallet.create([{
                userId: req.user.id,
                balance: 0,
                heldFunds: 0,
                totalDeposited: 0,
                totalSpent: 0
            }], { session }).then(([wallet]) => wallet);

            await Customer.findOneAndUpdate(
                { userId: req.user.id },
                { $set: { walletId: buyerWallet._id } },
                { session }
            );
        }

        if (buyerWallet.balance < finalPrice) {
            throw new Error('Insufficient wallet balance to complete this purchase');
        }

        const updatedBuyerWallet = await Wallet.findOneAndUpdate(
            { userId: req.user.id, balance: { $gte: finalPrice } },
            { $inc: { balance: -finalPrice, totalSpent: finalPrice } },
            { new: true, session }
        );

        if (!updatedBuyerWallet) {
            throw new Error('Insufficient wallet balance to complete this purchase');
        }

        const soldGemstone = await Gemstone.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'available',
                approvalStatus: 'approved',
                sellingMethod: 'instantPurchase',
            },
            { status: 'sold' },
            { new: true, session }
        );

        if (!soldGemstone) {
            throw new Error('This gemstone was just purchased by another user');
        }

        let sellerWallet = await Wallet.findOne({ userId: gemstone.sellerId?._id || gemstone.sellerId }).session(session);
        if (!sellerWallet) {
            sellerWallet = await Wallet.create([{
                userId: gemstone.sellerId?._id || gemstone.sellerId,
                balance: 0,
                heldFunds: 0,
                totalDeposited: 0,
                totalSpent: 0
            }], { session }).then(([wallet]) => wallet);

            await Customer.findOneAndUpdate(
                { userId: gemstone.sellerId?._id || gemstone.sellerId },
                { $set: { walletId: sellerWallet._id } },
                { session }
            );
        }

        const updatedSellerWallet = await Wallet.findOneAndUpdate(
            { _id: sellerWallet._id },
            { $inc: { balance: finalPrice } },
            { new: true, session }
        );

            const order = await Order.create([{
                gemId: soldGemstone._id,
                buyerId: req.user.id,
                sellerId: gemstone.sellerId?._id || gemstone.sellerId,
                totalAmount: finalPrice,
                discount: discount,
                eventDiscountId: activeEvent ? activeEvent._id : null,
                eventName: activeEvent ? activeEvent.title : '',
                eventDiscountPercentage: activeEvent ? activeEvent.discountPercentage || 0 : 0,
                status: 'processing',
                shippingAddress,
            }], { session }).then(([createdOrder]) => createdOrder);

        // Only update Customer shipping address if they have a Customer profile
        if (customer) {
            await Customer.findOneAndUpdate(
                { userId: req.user.id },
                { $set: { shippingAddress } },
                { session }
            );
        }

            await Transaction.create([{
                walletId: updatedBuyerWallet._id,
                userId: req.user.id,
                type: 'purchase',
                amount: finalPrice,
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
            }], { session });

        await Transaction.create([{
            walletId: updatedSellerWallet._id,
            userId: gemstone.sellerId?._id || gemstone.sellerId,
            type: 'payment',
            amount: finalPrice,
            status: 'completed',
            relatedId: order._id,
            description: `Sale payout for ${soldGemstone.title}`,
            title: soldGemstone.title,
            subtitle: `Purchased by ${req.user.name || 'Customer'}`,
            metadata: {
                gemId: soldGemstone._id,
                orderId: order._id,
                buyerId: req.user.id,
            }
        }], { session });

            responsePayload = {
                success: true,
                message: 'Gem purchased successfully',
                data: {
                    order,
                    gemstone: soldGemstone,
                    wallet: {
                        balance: updatedBuyerWallet.balance,
                        heldFunds: updatedBuyerWallet.heldFunds,
                        availableBalance: updatedBuyerWallet.balance - updatedBuyerWallet.heldFunds,
                        totalSpent: updatedBuyerWallet.totalSpent,
                    },
                    sellerWallet: {
                        balance: updatedSellerWallet.balance,
                        heldFunds: updatedSellerWallet.heldFunds,
                        availableBalance: updatedSellerWallet.balance - updatedSellerWallet.heldFunds,
                    }
                }
            };

            // Send email notification to seller
            try {
                const sellerEmail = gemstone.sellerId?.email || gemstone.sellerId;
                const sellerName = gemstone.sellerId?.name || 'Seller';
                const gemImage = gemstone.images && gemstone.images.length > 0 ? gemstone.images[0].url : null;

                await sendEmail(
                    sellerEmail,
                    'GEM_PURCHASED_SELLER',
                    sellerName,
                    req.user.name || 'Customer',
                    req.user.email || 'customer@email.com',
                    gemstone.title,
                    originalPrice,
                    discount,
                    activeEvent ? activeEvent.discountPercentage : 0,
                    activeEvent ? activeEvent.title : '',
                    shippingAddress,
                    order._id.toString(),
                    gemImage
                );
            } catch (emailError) {
                // Don't fail the purchase if email fails
                console.error('Error sending seller email notification:', emailError);
            }
        });

        return res.status(201).json({
            ...responsePayload
        });
    } catch (error) {
        if (error.message === 'Gemstone not found') {
            return res.status(404).json({ success: false, message: error.message });
        }

        if (error.message === 'This gemstone was just purchased by another user') {
            return res.status(409).json({ success: false, message: error.message });
        }

        if (
            error.message === 'This gemstone is no longer available for purchase' ||
            error.message === 'This gemstone cannot be purchased directly' ||
            error.message === 'You cannot purchase your own gemstone listing' ||
            error.message === 'This gemstone has an invalid purchase price' ||
            error.message === 'A valid shipping address is required for purchase' ||
            error.message === 'Insufficient wallet balance to complete this purchase' ||
            error.message === 'Customer profile not found'
        ) {
            return res.status(400).json({ success: false, message: error.message });
        }

        console.error('Error purchasing gemstone:', error);
        return res.status(500).json({ success: false, message: 'Error completing gemstone purchase', error: error.message });
    } finally {
        if (session) {
            await session.endSession();
        }
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
