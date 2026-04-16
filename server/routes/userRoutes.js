const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Customer, Seller } = require('../models');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get current user's full profile (User + Customer + Seller)
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Get customer record (phoneNumber, shippingAddress)
        const customer = await Customer.findOne({ userId: user._id });

        // Get seller record if user is a seller
        const seller = user.role === 'seller'
            ? await Seller.findOne({ userId: user._id })
            : null;

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                phoneNumber: customer?.phoneNumber || '',
                shippingAddress: customer?.shippingAddress || {},
                businessName: seller?.businessName || '',
                businessRegistration: seller?.businessRegistration || '',
                sellerStatus: seller?.verificationStatus || null
            }
        });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email, phoneNumber, shippingAddress, businessName, businessRegistration } = req.body;

        // Update User document
        const userUpdates = {};
        if (name) userUpdates.name = name;
        if (email) userUpdates.email = email.toLowerCase();

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userUpdates },
            { new: true, runValidators: true }
        );

        // Update or create Customer document
        const customerUpdates = {};
        if (phoneNumber !== undefined) customerUpdates.phoneNumber = phoneNumber;
        if (shippingAddress !== undefined) customerUpdates.shippingAddress = shippingAddress;

        const customer = await Customer.findOneAndUpdate(
            { userId: req.user.id },
            { $set: customerUpdates },
            { new: true, upsert: true }
        );

        // Update Seller document if applicable
        let seller = null;
        if (user.role === 'seller') {
            const sellerUpdates = {};
            if (businessName !== undefined) sellerUpdates.businessName = businessName;
            if (businessRegistration !== undefined) sellerUpdates.businessRegistration = businessRegistration;

            seller = await Seller.findOneAndUpdate(
                { userId: req.user.id },
                { $set: sellerUpdates },
                { new: true }
            );
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                phoneNumber: customer?.phoneNumber || '',
                shippingAddress: customer?.shippingAddress || {},
                businessName: seller?.businessName || '',
                businessRegistration: seller?.businessRegistration || '',
                sellerStatus: seller?.verificationStatus || null
            }
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/change-password
// @desc    Change current user's password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        // Must select password explicitly (select: false in schema)
        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Set new password — pre-save hook will hash it
        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;