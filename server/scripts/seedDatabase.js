const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Debug
console.log('Checking environment variables...');
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    process.exit(1);
}

const hiddenUri = process.env.MONGO_URI.replace(/:[^:@]*@/, ':****@');
console.log('MongoDB URI:', hiddenUri, '\n');

// Import all models
const {
    User,
    Customer,
    Seller,
    Admin,
    Wallet,
    Transaction,
    TopUpRequest,
    Gemstone,
    GemstoneApproval,
    Auction,
    Bid,
    AuctionHistory,
    Order,
    Dispute,
    Event,
    EventAttendance,
    EventDiscount
} = require('../models');

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, );
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

// Seed function
const seedDatabase = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');

        // Clear all collections
        await User.deleteMany({});
        await Customer.deleteMany({});
        await Seller.deleteMany({});
        await Admin.deleteMany({});
        await Wallet.deleteMany({});
        await Transaction.deleteMany({});
        await TopUpRequest.deleteMany({});
        await Gemstone.deleteMany({});
        await GemstoneApproval.deleteMany({});
        await Auction.deleteMany({});
        await Bid.deleteMany({});
        await AuctionHistory.deleteMany({});
        await Order.deleteMany({});
        await Dispute.deleteMany({});
        await Event.deleteMany({});
        await EventAttendance.deleteMany({});
        await EventDiscount.deleteMany({});

        console.log('Creating sample data...');

        // 1. Create Admin User
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@gemmarket.com',
            password: 'admin123',
            role: 'admin'
        });

        await Admin.create({
            userId: adminUser._id,
            permissions: [
                'approveSellerVerification',
                'approveGemstoneListings',
                'approveWalletTopUps',
                'monitorTransactions',
                'handleDisputes',
                'generateReports'
            ]
        });

        // 2. Create Buyer Users
        const buyer1 = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
            role: 'buyer'
        });

        const wallet1 = await Wallet.create({
            userId: buyer1._id,
            balance: 50000,
            heldFunds: 0,
            totalDeposited: 50000,
            totalSpent: 0
        });

        await Customer.create({
            userId: buyer1._id,
            shippingAddress: {
                street: '123 Main St',
                city: 'Colombo',
                state: 'Western',
                postalCode: '00100',
                country: 'Sri Lanka'
            },
            phoneNumber: '+94771234567',
            isVerified: true,
            walletId: wallet1._id
        });

        const buyer2 = await User.create({
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: 'password123',
            role: 'buyer'
        });

        const wallet2 = await Wallet.create({
            userId: buyer2._id,
            balance: 75000,
            heldFunds: 0,
            totalDeposited: 75000,
            totalSpent: 0
        });

        await Customer.create({
            userId: buyer2._id,
            shippingAddress: {
                street: '456 Park Ave',
                city: 'Kandy',
                state: 'Central',
                postalCode: '20000',
                country: 'Sri Lanka'
            },
            phoneNumber: '+94777654321',
            isVerified: true,
            walletId: wallet2._id
        });

        // 3. Create Seller Users
        const seller1 = await User.create({
            name: 'GemLanka Official',
            email: 'seller@gemlanka.com',
            password: 'password123',
            role: 'seller'
        });

        await Seller.create({
            userId: seller1._id,
            businessName: 'GemLanka Trading Co.',
            businessRegistration: 'PV123456',
            taxId: '123456789',
            verificationStatus: 'approved',
            verificationDocuments: [
                {
                    type: 'businessRegistration',
                    url: 'https://example.com/doc1.pdf',
                    uploadedAt: new Date()
                }
            ],
            verifiedBy: adminUser._id,
            verifiedAt: new Date()
        });

        const seller2 = await User.create({
            name: 'Royal Gems LK',
            email: 'seller@royalgems.com',
            password: 'password123',
            role: 'seller'
        });

        await Seller.create({
            userId: seller2._id,
            businessName: 'Royal Gems Lanka',
            businessRegistration: 'PV789012',
            taxId: '987654321',
            verificationStatus: 'pending',
            verificationDocuments: []
        });

        // 4. Create Gemstones
        const gemstone1 = await Gemstone.create({
            sellerId: seller1._id,
            title: 'Royal Blue Sapphire',
            description: 'A stunning 2.54 carat royal blue sapphire from Ratnapura',
            attributes: {
                carat: 2.54,
                color: 'Royal Blue',
                clarity: 'VS',
                cut: 'Oval',
                shape: 'Oval',
                origin: 'Ratnapura, Sri Lanka',
                treatment: 'Heated',
                dimensions: {
                    length: 8.5,
                    width: 6.2,
                    height: 4.1
                }
            },
            images: [
                {
                    url: 'https://example.com/sapphire1.jpg',
                    isPrimary: true
                }
            ],
            certifications: [
                {
                    type: 'GIA',
                    certificateNumber: 'GIA-2023-12345',
                    url: 'https://example.com/cert1.pdf',
                    issuedDate: new Date('2023-01-15')
                }
            ],
            sellingMethod: 'auction',
            status: 'underAuction',
            approvalStatus: 'approved'
        });

        const gemstone2 = await Gemstone.create({
            sellerId: seller1._id,
            title: 'Yellow Sapphire (Pushparagam)',
            description: 'Beautiful 1.5 carat yellow sapphire, unheated',
            attributes: {
                carat: 1.5,
                color: 'Yellow',
                clarity: 'VVS',
                cut: 'Cushion',
                shape: 'Cushion',
                origin: 'Sri Lanka',
                treatment: 'Unheated',
                dimensions: {
                    length: 7.2,
                    width: 6.8,
                    height: 3.9
                }
            },
            images: [
                {
                    url: 'https://example.com/sapphire2.jpg',
                    isPrimary: true
                }
            ],
            certifications: [],
            sellingMethod: 'instantPurchase',
            price: 125000,
            status: 'available',
            approvalStatus: 'approved'
        });

        // 5. Create Auction
        const auction1 = await Auction.create({
            gemId: gemstone1._id,
            sellerId: seller1._id,
            startPrice: 100000,
            currentPrice: 125000,
            minIncrement: 5000,
            reservePrice: 150000,
            startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            status: 'active',
            totalBids: 3
        });

        // 6. Create Bids
        await Bid.create({
            auctionId: auction1._id,
            bidderId: buyer1._id,
            bidAmount: 105000,
            bidTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            isWinning: false,
            isOutbid: true
        });

        await Bid.create({
            auctionId: auction1._id,
            bidderId: buyer2._id,
            bidAmount: 115000,
            bidTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
            isWinning: false,
            isOutbid: true
        });

        await Bid.create({
            auctionId: auction1._id,
            bidderId: buyer1._id,
            bidAmount: 125000,
            bidTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
            isWinning: true,
            isOutbid: false
        });

        // 7. Create Event
        const event1 = await Event.create({
            title: 'Colombo Gem & Jewelry Exhibition 2024',
            description: 'Annual gemstone exhibition featuring the finest Sri Lankan gems',
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            type: 'exhibition',
            images: [
                {
                    url: 'https://example.com/event1.jpg',
                    isPrimary: true
                }
            ],
            location: {
                address: 'BMICH, Colombo 07',
                lat: 6.9271,
                lng: 79.8612
            },
            discountPercentage: 15,
            status: 'upcoming',
            maxAttendees: 500,
            currentAttendees: 0
        });

        // 8. Create Event Attendance
        await EventAttendance.create({
            eventId: event1._id,
            userId: buyer1._id,
            registeredAt: new Date(),
            attended: false
        });

        console.log('\n✅ Database seeded successfully!');
        console.log('\nCreated:');
        console.log('- 3 Users (1 admin, 2 buyers)');
        console.log('- 2 Sellers');
        console.log('- 2 Customers with Wallets');
        console.log('- 2 Gemstones');
        console.log('- 1 Active Auction with 3 Bids');
        console.log('- 1 Event with 1 Attendance');
        console.log('\n✨ You can now refresh IntelliJ to see all collections!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();