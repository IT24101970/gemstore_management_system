const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const Gemstone = require('../models/Gemstone');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const valid =
            allowed.test(file.mimetype.toLowerCase());

        if (valid) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed (jpeg, jpg, png, webp)'));
        }
    }
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

const mapEventType = (type) => {
    if (!type) return 'exhibition';

    const value = type.toLowerCase().trim();

    if (value === 'exhibition') return 'exhibition';
    if (value === 'auction event' || value === 'auction') return 'auction';
    if (value === 'workshop') return 'workshop';
    if (value === 'conference') return 'conference';
    if (value === 'discount_sale') return 'discount_sale';

    return 'exhibition';
};

// GET all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });

        const formattedEvents = events.map(event => ({
            _id: event._id,
            title: event.title,
            description: event.description,
            type: event.type,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location?.city || '',
            address: event.location?.venue || event.location?.address || '',
            discount: event.discountPercentage || 0,
            discountDescription: event.discountDescription || '',
            images: event.images || [],
            status: event.status,
            maxAttendees: event.maxAttendees
        }));

        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// GET purchase history during event periods
router.get('/history', async (req, res) => {
    try {
        const orders = await Order.find({
            eventName: { $exists: true, $ne: '' }
        }).lean();

        const history = [];

        for (const order of orders) {
            const orderDate = new Date(order.createdAt);


            const customer = order.buyerId
                ? await User.findById(order.buyerId).lean()
                : null;

            const gem = order.gemId
                ? await Gemstone.findById(order.gemId).lean()
                : null;

            history.push({
                customerName: customer?.name || 'Unknown Customer',
                email: customer?.email || 'N/A',
                gemName: gem?.title || 'Unknown Gem',
                originalPrice: gem?.price || 0,
                discount: order.discount || 0,
                finalPrice: order.totalAmount || 0,
                date: order.createdAt,
                eventName: order.eventName || 'Unknown Event'
            });
        }

        res.status(200).json(history);
    } catch (err) {
        console.error('Error fetching event history:', err);
        res.status(500).json({
            message: 'Error fetching history',
            error: err.message
        });
    }
});

// DOWNLOAD purchase history as CSV
router.get('/history/download', async (req, res) => {
    try {
        const orders = await Order.find({
            eventName: { $exists: true, $ne: '' }
        }).lean();

        let csv =
            'Customer Name,Email,Gem Name,Original Price,Discount,Final Price,Order Date,Event Name\n';

        for (const order of orders) {
            const orderDate = new Date(order.createdAt);


            const customer = order.buyerId
                ? await User.findById(order.buyerId).lean()
                : null;

            const gem = order.gemId
                ? await Gemstone.findById(order.gemId).lean()
                : null;

            const customerName = customer?.name || 'Unknown Customer';
            const email = customer?.email || 'N/A';
            const gemName = gem?.title || 'Unknown Gem';
            const originalPrice = gem?.price || 0;
            const discount = order.discount || 0;
            const finalPrice = order.totalAmount || 0;
            const eventName = order.eventName || 'Unknown Event';
            const safeDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-CA')
                : 'N/A';

            csv += `"${customerName}","${email}","${gemName}","${originalPrice}","${discount}","${finalPrice}","${safeDate}","${eventName}"\n`;
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=event-history.csv');

        return res.status(200).send(csv);
    } catch (error) {
        console.error('Download history error:', error);
        return res.status(500).json({
            message: 'Error generating report',
            error: error.message
        });
    }
});

// GET one event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Failed to fetch event' });
    }
});

// CREATE event
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            location,
            address,
            capacity,
            contactEmail,
            contactPhone,
            hasDiscount,
            discount,
            discountDescription,
        } = req.body;

        if (!title || !description || !startDate || !endDate || !location) {
            return res.status(400).json({
                message: 'Title, description, start date, end date and location are required'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid event dates' });
        }

        if (end < start) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        // ✅ UPLOAD IMAGE TO CLOUDINARY
        let imageUrl = '';
        let imagePublicId = '';

        if (req.file) {
            try {
                const imageUpload = await uploadToCloudinary(
                    req.file.buffer,
                    'events',
                    `${Date.now()}-${req.file.originalname}`
                );
                imageUrl = imageUpload.secure_url;
                imagePublicId = imageUpload.public_id;
                console.log('✅ Event image uploaded to Cloudinary');
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload event image to cloud storage'
                });
            }
        }

        const newEvent = new Event({
            title,
            description,
            type: mapEventType(type),
            startDate: start,
            endDate: end,
            startTime: startTime || '',
            endTime: endTime || '',
            location: {
                city: location,
                venue: address
            },
            contactEmail,
            contactPhone,
            discountPercentage: hasDiscount === true || hasDiscount === 'true'
                ? Number(discount || 0)
                : 0,
            discountDescription: discountDescription || '',
            status: 'upcoming',
            maxAttendees: capacity ? Number(capacity) : undefined,
            images: imageUrl
                ? [{
                    url: imageUrl,
                    publicId: imagePublicId,
                    isPrimary: true
                }]
                : []
        });

        const savedEvent = await newEvent.save();

        res.status(201).json({
            message: 'Event created successfully',
            data: savedEvent
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            message: 'Failed to create event',
            error: error.message
        });
    }
});

// UPDATE event
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const existingEvent = await Event.findById(req.params.id);

        if (!existingEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const {
            title,
            description,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            location,
            address,
            capacity,
            hasDiscount,
            discount,
            discountDescription,
            images,
            status
        } = req.body;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: 'Invalid event dates' });
            }

            if (end < start) {
                return res.status(400).json({ message: 'End date must be after start date' });
            }
        }

        // ✅ HANDLE IMAGE UPDATE
        let updatedImages = images ? (Array.isArray(images) ? images : [images]) : existingEvent.images;

        if (req.file) {
            try {
                // Delete old image from Cloudinary
                if (existingEvent.images && existingEvent.images.length > 0) {
                    const oldImage = existingEvent.images[0];
                    if (oldImage.publicId) {
                        await deleteFromCloudinary(oldImage.publicId);
                        console.log(`✅ Deleted old event image from Cloudinary`);
                    }
                }

                // Upload new image
                const imageUpload = await uploadToCloudinary(
                    req.file.buffer,
                    'events',
                    `${Date.now()}-${req.file.originalname}`
                );

                updatedImages = [{
                    url: imageUpload.secure_url,
                    publicId: imageUpload.public_id,
                    isPrimary: true
                }];

                console.log('✅ New event image uploaded to Cloudinary');
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload event image to cloud storage'
                });
            }
        }

        const updateData = {
            title,
            description,
            type: type ? mapEventType(type) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            startTime,
            endTime,
            location: (location || address)
                ? {
                    city: location || '',
                    venue: address || ''
                }
                : undefined,
            discountPercentage: hasDiscount === true || hasDiscount === 'true'
                ? Number(discount || 0)
                : 0,
            discountDescription,
            maxAttendees: capacity ? Number(capacity) : undefined,
            images: updatedImages,
            status
        };

        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            message: 'Failed to update event',
            error: error.message
        });
    }
});

// DELETE event
router.delete('/:id', async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // ✅ DELETE IMAGE FROM CLOUDINARY
        if (deletedEvent.images && deletedEvent.images.length > 0) {
            for (const img of deletedEvent.images) {
                if (img.publicId) {
                    await deleteFromCloudinary(img.publicId);
                    console.log(`✅ Deleted event image from Cloudinary: ${img.publicId}`);
                }
            }
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Failed to delete event' });
    }
});

module.exports = router;