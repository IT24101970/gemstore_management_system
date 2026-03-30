const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const Gemstone = require('../models/Gemstone');


const mapEventType = (type) => {
    if (!type) return 'exhibition';

    const value = type.toLowerCase().trim();

    if (value === 'exhibition') return 'exhibition';
    if (value === 'auction event' || value === 'auction') return 'auction';
    if (value === 'workshop') return 'workshop';
    if (value === 'conference' || value === 'seminar') return 'seminar';
    if (value === 'fair' || value === 'discount sale' || value === 'trade show') return 'trade_show';

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
            address: event.location?.venue || '',
            discount: event.discountPercentage || 0,
            discountDescription: event.discountDescription || '',
            images: event.images || [],
            status: event.status
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
        const orders = await Order.find().lean();
        const events = await Event.find().lean();

        const history = [];

        for (const order of orders) {
            const orderDate = new Date(order.createdAt);

            const matchedEvent = events.find(event => {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                return orderDate >= start && orderDate <= end;
            });

            if (!matchedEvent) continue;

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
                eventName: matchedEvent.title || 'Unknown Event'
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
router.post('/', async (req, res) => {
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
            hasDiscount,
            discount,
            discountDescription,
            images
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
            discountPercentage: hasDiscount === true || hasDiscount === 'true'
                ? Number(discount || 0)
                : 0,
            discountDescription: discountDescription || '',
            status: 'upcoming',
            maxAttendees: capacity ? Number(capacity) : undefined,
            images: Array.isArray(images) ? images : []
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
router.put('/:id', async (req, res) => {
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

        const updateData = {
            title,
            description,
            type: type ? mapEventType(type) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            startTime,
            endTime,
            location: {
                city: location,
                venue: address
            },
            discountPercentage: hasDiscount === true || hasDiscount === 'true'
                ? Number(discount || 0)
                : 0,
            discountDescription,
            maxAttendees: capacity ? Number(capacity) : undefined,
            images: Array.isArray(images) ? images : undefined,
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

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

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

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Failed to delete event' });
    }
});

module.exports = router;