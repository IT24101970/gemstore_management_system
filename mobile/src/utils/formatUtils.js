// src/utils/formatUtils.js
export const formatPrice = (price) => {
    try {
        const num = parseFloat(price);
        if (isNaN(num)) return '$0.00';
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (err) {
        return '$0.00';
    }
};

export const formatCurrency = (amount) => {
    try {
        const num = parseFloat(amount);
        if (isNaN(num)) return '0.00';
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (err) {
        return '0.00';
    }
};

export const getImageUrl = (item) => {
    if (!item) return 'https://via.placeholder.com/300x200?text=No+Image';

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const primaryImage = item.images.find(img => img.isPrimary);
        return primaryImage?.url || item.images[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image';
    }

    return 'https://via.placeholder.com/300x200?text=No+Image';
};

export const getAuctionImage = (auction) => {
    if (!auction?.gemId) return 'https://via.placeholder.com/300x200?text=No+Image';
    return getImageUrl(auction.gemId);
};