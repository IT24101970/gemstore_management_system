const nodemailer = require('nodemailer');

// Configure email provider
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS (port 587), NOT SSL (port 465)
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Templates
const emailTemplates = {
    // Buyer was outbid
    OUTBID: (buyerName, auctionGem, newBid, auctionId) => ({
        subject: `You've been outbid! 😕 - ${auctionGem}`,
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">You've Been Outbid! 😕</h1>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">Hi <strong>${buyerName}</strong>,</p>
                    
                    <p style="color: #4b5563;">Unfortunately, someone has placed a higher bid on the auction you were winning:</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #667eea;">
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Gem</p>
                        <h2 style="margin: 0 0 1rem 0; color: #1a202c;">${auctionGem}</h2>
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">New Highest Bid</p>
                        <p style="margin: 0; font-size: 1.5rem; color: #16a34a; font-weight: 700;">$${newBid.toFixed(2)}</p>
                    </div>

                    <p style="color: #4b5563;">You can place a new bid to try and win this auction. Act fast before the auction ends!</p>

                    <a href="http://localhost:5173/auction/${auctionId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        View Auction
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Marketplace</p>
                    <p style="margin: 0.5rem 0 0 0;">© 2026 All rights reserved</p>
                </div>
            </div>
        `
    }),

    // Auction won
    AUCTION_WON: (buyerName, auctionGem, finalPrice, auctionId) => ({
        subject: `🏆 Congratulations! You Won the Auction - ${auctionGem}`,
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">🏆 Congratulations! 🏆</h1>
                    <p style="margin: 0.5rem 0 0 0; font-size: 1.125rem;">You won the auction!</p>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">Hi <strong>${buyerName}</strong>,</p>
                    
                    <p style="color: #4b5563;">Great news! You've won the auction for:</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #22c55e;">
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Gem</p>
                        <h2 style="margin: 0 0 1rem 0; color: #1a202c;">${auctionGem}</h2>
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Final Winning Bid</p>
                        <p style="margin: 0; font-size: 1.5rem; color: #16a34a; font-weight: 700;">$${finalPrice.toFixed(2)}</p>
                    </div>

                    <p style="color: #4b5563;"><strong>What's next?</strong></p>
                    <ul style="color: #4b5563;">
                        <li>The seller will contact you shortly with shipping details</li>
                        <li>You can track your order in your dashboard</li>
                        <li>Payment will be processed from your wallet</li>
                    </ul>

                    <a href="http://localhost:5173/wallet" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        View Your Wallet
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Marketplace</p>
                    <p style="margin: 0.5rem 0 0 0;">© 2026 All rights reserved</p>
                </div>
            </div>
        `
    }),

    // Auction ended (no winner)
    AUCTION_ENDED_NO_WINNER: (sellerName, gemName, auctionId) => ({
        subject: `Auction Ended - No Winner - ${gemName}`,
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">Auction Ended</h1>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">Hi <strong>${sellerName}</strong>,</p>
                    
                    <p style="color: #4b5563;">Your auction has ended with no bids or the reserve price was not met.</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Gem</p>
                        <h2 style="margin: 0; color: #1a202c;">${gemName}</h2>
                    </div>

                    <p style="color: #4b5563;">You can create a new auction or adjust your reserve price if you'd like to list it again.</p>

                    <a href="http://localhost:5173/seller/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        Go to Dashboard
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Marketplace</p>
                    <p style="margin: 0.5rem 0 0 0;">© 2026 All rights reserved</p>
                </div>
            </div>
        `
    }),

    // User: Top-up request approved
    TOPUP_APPROVED: (userName, amount, referenceNumber) => ({
        subject: '✅ Your Wallet Top-Up Request Has Been Approved',
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">✅ Top-Up Approved!</h1>
                    <p style="margin: 0.5rem 0 0 0; font-size: 1.125rem;">Your funds are ready to use</p>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
                    
                    <p style="color: #4b5563;">Great news! Your wallet top-up request has been approved by our admin team. The funds have been added to your wallet and are ready to use.</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #22c55e;">
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Top-Up Amount</p>
                        <p style="margin: 0 0 1rem 0; font-size: 1.875rem; color: #16a34a; font-weight: 700;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p style="margin: 0; color: #6b7280;">
                            <strong>Reference:</strong> ${referenceNumber}
                        </p>
                    </div>

                    <p style="color: #4b5563;"><strong>You can now:</strong></p>
                    <ul style="color: #4b5563; line-height: 1.8;">
                        <li>Place bids on live auctions</li>
                        <li>Purchase gemstones from the marketplace</li>
                        <li>Participate in special events</li>
                    </ul>

                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        View Your Wallet
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Marketplace</p>
                    <p style="margin: 0.5rem 0 0 0;">© 2026 All rights reserved</p>
                </div>
            </div>
        `
    }),

    // User: Top-up request rejected
    TOPUP_REJECTED: (userName, amount, referenceNumber, rejectionReason) => ({
        subject: '❌ Your Wallet Top-Up Request Was Rejected',
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">❌ Top-Up Rejected</h1>
                    <p style="margin: 0.5rem 0 0 0; font-size: 1.125rem;">Please review the reason below</p>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
                    
                    <p style="color: #4b5563;">Unfortunately, your wallet top-up request could not be approved. Please review the rejection reason below and resubmit with the correct information.</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #ef4444;">
                        <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Top-Up Amount</p>
                        <p style="margin: 0 0 1rem 0; font-size: 1.875rem; color: #dc2626; font-weight: 700;">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p style="margin: 0; color: #6b7280;">
                            <strong>Reference:</strong> ${referenceNumber}
                        </p>
                    </div>

                    <div style="background: #fef2f2; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #ef4444;">
                        <p style="margin: 0 0 0.75rem 0; color: #7f1d1d; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem;">Rejection Reason</p>
                        <p style="margin: 0; color: #991b1b; line-height: 1.6;">
                            ${rejectionReason || 'No reason provided. Please contact support for more details.'}
                        </p>
                    </div>

                    <p style="color: #4b5563;"><strong>What can you do?</strong></p>
                    <ul style="color: #4b5563; line-height: 1.8;">
                        <li>Review the rejection reason carefully</li>
                        <li>Ensure your receipt/documentation is clear and valid</li>
                        <li>Verify all details match your submission</li>
                        <li>Submit a new request with corrected information</li>
                    </ul>

                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        Submit New Request
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Marketplace</p>
                    <p style="margin: 0.5rem 0 0 0; color: #6b7280;">Need help? Contact us at support@ceylonGems.com</p>
                </div>
            </div>
        `
    }),

    // Gem purchased - notify seller
    GEM_PURCHASED_SELLER: (sellerName, buyerName, buyerEmail, gemName, gemPrice, discount, discountPercentage, eventName, shippingAddress, orderId, gemImage) => ({
        subject: `🛍️ Your Gem Sold! - ${gemName}`,
        html: `
        <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                <h1 style="margin: 0;">🛍️ Your Gem Has Been Sold!</h1>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.125rem;">Order confirmed and ready to ship</p>
            </div>

            <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                <p style="color: #4b5563; margin-top: 0;">Hi <strong>${sellerName}</strong>,</p>
                
                <p style="color: #4b5563;">Congratulations! Your gemstone has been purchased. Here are the order details:</p>

                <!-- Gem Details Card -->
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #667eea;">
                    ${gemImage ? `<img src="${gemImage}" alt="${gemName}" style="width: 100%; max-width: 400px; height: auto; border-radius: 0.5rem; margin-bottom: 1rem; object-fit: cover;">` : ''}
                    
                    <p style="margin: 0 0 0.5rem 0; color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Gemstone</p>
                    <h2 style="margin: 0 0 1rem 0; color: #1a202c; font-size: 1.5rem;">${gemName}</h2>

                    <table style="width: 100%; margin: 1rem 0;">
                        <tr>
                            <td style="padding: 0.5rem 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">
                                <strong>Original Price:</strong>
                            </td>
                            <td style="padding: 0.5rem 0; text-align: right; color: #1a202c; border-bottom: 1px solid #e5e7eb;">
                                $${gemPrice.toFixed(2)}
                            </td>
                        </tr>
                        ${discount > 0 ? `
                        <tr>
                            <td style="padding: 0.5rem 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">
                                <strong>Event Discount (${discountPercentage}%):</strong>
                            </td>
                            <td style="padding: 0.5rem 0; text-align: right; color: #ef4444; border-bottom: 1px solid #e5e7eb;">
                                -$${discount.toFixed(2)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem 0; color: #1a202c; font-weight: 700;">
                                <strong>Final Sale Price:</strong>
                            </td>
                            <td style="padding: 0.75rem 0; text-align: right; color: #16a34a; font-weight: 700; font-size: 1.25rem;">
                                $${(gemPrice - discount).toFixed(2)}
                            </td>
                        </tr>
                        ` : `
                        <tr>
                            <td style="padding: 0.75rem 0; color: #1a202c; font-weight: 700;">
                                <strong>Sale Price:</strong>
                            </td>
                            <td style="padding: 0.75rem 0; text-align: right; color: #16a34a; font-weight: 700; font-size: 1.25rem;">
                                $${gemPrice.toFixed(2)}
                            </td>
                        </tr>
                        `}
                    </table>

                    ${eventName ? `
                    <p style="margin: 1rem 0 0 0; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
                        <strong>Promotion:</strong> ${eventName}
                    </p>
                    ` : ''}
                </div>

                <!-- Buyer Information Card -->
                <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #22c55e;">
                    <p style="margin: 0 0 1rem 0; color: #1a202c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem;">Buyer Information</p>
                    
                    <p style="margin: 0 0 0.5rem 0; color: #4b5563;">
                        <strong>Name:</strong> ${buyerName}
                    </p>
                    <p style="margin: 0 0 1rem 0; color: #4b5563;">
                        <strong>Email:</strong> <a href="mailto:${buyerEmail}" style="color: #667eea; text-decoration: none;">${buyerEmail}</a>
                    </p>

                    <p style="margin: 0 0 0.75rem 0; color: #1a202c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem;">Shipping Address</p>
                    <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                        ${shippingAddress.street}<br>
                        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
                        ${shippingAddress.country}
                    </p>
                </div>

                <!-- Order Details Card -->
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #0284c7;">
                    <p style="margin: 0 0 0.5rem 0; color: #0c4a6e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.875rem;">Order Details</p>
                    <p style="margin: 0; color: #075985;">
                        <strong>Order ID:</strong> ${orderId}
                    </p>
                    <p style="margin: 0.5rem 0 0 0; color: #075985;">
                        <strong>Status:</strong> Processing
                    </p>
                </div>

                <p style="color: #4b5563; margin-top: 1.5rem;"><strong>Next Steps:</strong></p>
                <ul style="color: #4b5563; line-height: 1.8; margin: 0.5rem 0 0 0;">
                    <li>Prepare the gemstone for shipment</li>
                    <li>Package securely with proper documentation</li>
                    <li>Update the order with tracking information</li>
                    <li>The buyer will receive their tracking details once shipped</li>
                </ul>

                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/seller/orders/${orderId}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1.5rem;">
                    View Order Details
                </a>
            </div>

            <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                <p style="margin: 0;">Ceylon Gems Marketplace</p>
                <p style="margin: 0.5rem 0 0 0;">© 2026 All rights reserved</p>
            </div>
        </div>
    `
    }),
};


// ✅ Send Email Function
const sendEmail = async (email, templateName, ...args) => {
    try {
        if (!emailTemplates[templateName]) {
            console.error(`❌ Email template "${templateName}" not found`);
            return false;
        }

        const emailContent = emailTemplates[templateName](...args);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            ...emailContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email} (${templateName})`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending email to ${email}:`, error);
        return false;
    }
};


module.exports = { sendEmail, emailTemplates };