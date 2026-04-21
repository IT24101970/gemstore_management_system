const nodemailer = require('nodemailer');

// ✅ Configure your email provider
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use app password, not regular password
    }
});

// ✅ Email Templates
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

    // Admin: New topup request
    ADMIN_NEW_TOPUP_REQUEST: (userName, amount, reference) => ({
        subject: `🔔 New Top-Up Request - $${amount.toFixed(2)}`,
        html: `
            <div style="font-family: 'DM Sans', Arial; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 2rem; border-radius: 1rem; color: white; text-align: center;">
                    <h1 style="margin: 0;">🔔 New Top-Up Request</h1>
                </div>

                <div style="padding: 2rem; background: #f9fafb; border-radius: 1rem; margin-top: 1rem;">
                    <p style="color: #4b5563; margin-top: 0;">A new wallet top-up request requires approval:</p>

                    <div style="background: white; padding: 1.5rem; border-radius: 0.5rem; margin: 1.5rem 0; border-left: 4px solid #3b82f6;">
                        <p style="margin: 0 0 0.75rem 0;">
                            <strong style="color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">User:</strong><br>
                            <span style="color: #1a202c;">${userName}</span>
                        </p>
                        <p style="margin: 0 0 0.75rem 0;">
                            <strong style="color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Amount:</strong><br>
                            <span style="color: #16a34a; font-size: 1.25rem; font-weight: 700;">$${amount.toFixed(2)}</span>
                        </p>
                        <p style="margin: 0;">
                            <strong style="color: #9ca3af; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">Reference:</strong><br>
                            <span style="color: #1a202c;">${reference}</span>
                        </p>
                    </div>

                    <a href="http://localhost:5173/admin/topup-requests" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin-top: 1rem;">
                        Review Request
                    </a>
                </div>

                <div style="padding: 1.5rem; text-align: center; color: #9ca3af; font-size: 0.875rem; border-top: 1px solid #e5e7eb; margin-top: 1rem;">
                    <p style="margin: 0;">Ceylon Gems Admin Panel</p>
                </div>
            </div>
        `
    })
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