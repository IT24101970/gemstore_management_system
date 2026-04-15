const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
require('dotenv').config();

const dns = require('node:dns');
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS Configuration - Allow frontend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gemstones', require('./routes/gemstoneRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Gemstone Marketplace API is running...');
});

// ✅ SCHEDULED JOB: Update auction status every 30 seconds
const updateAuctionStatuses = async () => {
    try {
        const { Auction } = require('./models');
        const now = new Date();

        // Update scheduled auctions that should be active
        const result = await Auction.updateMany(
            {
                status: 'scheduled',
                startTime: { $lte: now }
            },
            {
                $set: { status: 'active' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Activated ${result.modifiedCount} auction(s)`);
        }

        // Update active auctions that should be ended
        const endedResult = await Auction.updateMany(
            {
                status: 'active',
                endTime: { $lte: now }
            },
            {
                $set: { status: 'ended' }
            }
        );

        if (endedResult.modifiedCount > 0) {
            console.log(`✅ Ended ${endedResult.modifiedCount} auction(s)`);
        }
    } catch (error) {
        console.error('❌ Error updating auction statuses:', error);
    }
};

// Run status update every 30 seconds
setInterval(updateAuctionStatuses, 30000);

// Also run on startup
updateAuctionStatuses();

// WebSocket connection
wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket connection');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'get-auctions') {
                const { Auction } = require('./models');
                const now = new Date();

                const auctions = await Auction.find({
                    status: 'active',
                    endTime: { $gt: now }
                })
                    .populate({
                        path: 'gemId',
                        select: 'title description attributes images'
                    })
                    .populate('sellerId', 'name')
                    .sort({ endTime: 1 })
                    .limit(8);

                const auctionsWithTime = auctions.map(auction => {
                    const timeRemaining = auction.endTime - now;
                    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                    return {
                        ...auction.toObject(),
                        timeRemaining: {
                            hours,
                            minutes,
                            formatted: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
                        }
                    };
                });

                ws.send(JSON.stringify({
                    type: 'auctions-data',
                    data: auctionsWithTime
                }));
            }
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
    });
});

// Broadcast auction update to all clients
global.broadcastAuctionUpdate = (auctionData) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'auction-updated',
                data: auctionData
            }));
        }
    });
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));