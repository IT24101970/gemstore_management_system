const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Customer, Seller, Wallet } = require('../models');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_12345',
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// @route   POST /api/auth/register
// @desc    Register a new user (buyer by default)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phoneNumber,
            shippingAddress,
            becomeSeller,
            businessName,
            businessRegistration,
            verificationDocuments
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate required fields
        if (!name || !email || !password || !phoneNumber || !shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Create user (everyone starts as buyer)
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password, // Will be hashed by the pre-save hook
            role: 'buyer'
        });

        // Create wallet for the user
        const wallet = await Wallet.create({
            userId: user._id,
            balance: 0,
            heldFunds: 0,
            totalDeposited: 0,
            totalSpent: 0
        });

        // Create customer record
        const customer = await Customer.create({
            userId: user._id,
            phoneNumber,
            shippingAddress,
            walletId: wallet._id
        });

        // If user wants to become a seller, create seller record
        if (becomeSeller) {
            if (!verificationDocuments || verificationDocuments.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification documents are required to become a seller'
                });
            }

            await Seller.create({
                userId: user._id,
                businessName: businessName || '',
                businessRegistration: businessRegistration || '',
                verificationDocuments,
                verificationStatus: 'pending'
            });

            // Update user role to seller
            user.role = 'seller';
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: becomeSeller
                ? 'Registration successful! Your seller account is pending approval.'
                : 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const customer = await Customer.findOne({ userId: req.user.id });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: customer?.phoneNumber || '',
                shippingAddress: customer?.shippingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Sri Lanka'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/me/address
// @desc    Update current user's shipping address
// @access  Private
router.put('/me/address', protect, async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({
                success: false,
                message: 'Street and city are required'
            });
        }

        const customer = await Customer.findOneAndUpdate(
            { userId: req.user.id },
            {
                $set: {
                    shippingAddress: {
                        street: shippingAddress.street || '',
                        city: shippingAddress.city || '',
                        state: shippingAddress.state || '',
                        postalCode: shippingAddress.postalCode || '',
                        country: shippingAddress.country || 'Sri Lanka'
                    }
                }
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Shipping address updated successfully',
            data: customer.shippingAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating shipping address',
            error: error.message
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
