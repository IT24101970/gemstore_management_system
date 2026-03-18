import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auctionAPI } from '../services/api';
import './AuctionPage.css';

const AuctionPage = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, ending-soon
    const [sortBy, setSortBy] = useState('ending-soon'); // ending-soon, newest, highest-bid, lowest-bid
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');

    // Fetch auctions
    useEffect(() => {
        fetchAuctions();

        // Refresh every 30 seconds
        const interval = setInterval(fetchAuctions, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAuctions = async () => {
        try {
            const response = await auctionAPI.getLive();
            setAuctions(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load auctions');
            setLoading(false);
            console.error(err);
        }
    };

    // Filter and sort auctions
    const getFilteredAuctions = () => {
        let filtered = [...auctions];

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(auction =>
                auction.gemId?.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply filter
        if (filter === 'active') {
            filtered = filtered.filter(auction => auction.status === 'active');
        } else if (filter === 'ending-soon') {
            const oneHour = 60 * 60 * 1000;
            filtered = filtered.filter(auction => {
                const timeLeft = new Date(auction.endTime) - new Date();
                return timeLeft <= oneHour && timeLeft > 0;
            });
        }

        // Apply sort
        if (sortBy === 'ending-soon') {
            filtered.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
        } else if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        } else if (sortBy === 'highest-bid') {
            filtered.sort((a, b) => b.currentPrice - a.currentPrice);
        } else if (sortBy === 'lowest-bid') {
            filtered.sort((a, b) => a.currentPrice - b.currentPrice);
        }

        return filtered;
    };

    // Calculate time remaining
    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) {
            return { ended: true, text: 'Auction Ended' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return { ended: false, text: `${days}d ${hours}h ${minutes}m` };
        } else if (hours > 0) {
            return { ended: false, text: `${hours}h ${minutes}m ${seconds}s` };
        } else {
            return { ended: false, text: `${minutes}m ${seconds}s`, urgent: true };
        }
    };

    // Open bid modal
    const openBidModal = (auction) => {
        setSelectedAuction(auction);
        setBidAmount((auction.currentPrice + auction.minIncrement).toFixed(2));
        setShowBidModal(true);
    };

    // Close bid modal
    const closeBidModal = () => {
        setShowBidModal(false);
        setSelectedAuction(null);
        setBidAmount('');
    };

    // Handle place bid (placeholder)
    const handlePlaceBid = (e) => {
        e.preventDefault();
        alert('Bid functionality will be implemented in the next phase!');
        closeBidModal();
    };

    // Get auction image
    const getAuctionImage = (auction) => {
        if (auction.gemId && auction.gemId.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    const filteredAuctions = getFilteredAuctions();

    return (
        <div className="auction-page">
            {/* Header */}
            <header className="auction-header">
                <div className="auction-header-container">
                    <div className="auction-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <nav className="auction-nav">
                        <Link to="/home" className="nav-item">Home</Link>
                        <Link to="/auction" className="nav-item active">Auctions</Link>
                        <Link to="/eventListing" className="nav-item ">Events</Link>
                    </nav>

                    <div className="auction-user-actions">
                        {user ? (
                            <>
                                <div className="auction-wallet">
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                    <span>$4,250</span>
                                </div>
                                <button className="home-icon-btn">
                                    <span className="material-symbols-outlined">notifications</span>
                                </button>
                                <button className="home-icon-btn">
                                    <span className="material-symbols-outlined">person</span>
                                </button>
                                <button onClick={onLogout} className="logout-btn">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="login-link">Login</Link>
                                <Link to="/register" className="register-link">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="auction-hero">
                <div className="auction-hero-content">
                    <h1 className="auction-hero-title">
                        <span className="material-symbols-outlined live-pulse">sensors</span>
                        Live Auctions
                    </h1>
                    <p className="auction-hero-subtitle">
                        Bid on exclusive Ceylon gemstones in real-time
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="auction-main">
                <div className="auction-container">
                    {/* Filters and Search */}
                    <div className="auction-controls">
                        {/* Search Bar */}
                        <div className="auction-search">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Search auctions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="auction-filters">
                            <button
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All Auctions
                            </button>
                            <button
                                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                                onClick={() => setFilter('active')}
                            >
                                <span className="material-symbols-outlined">live_tv</span>
                                Active
                            </button>
                            <button
                                className={`filter-btn ${filter === 'ending-soon' ? 'active' : ''}`}
                                onClick={() => setFilter('ending-soon')}
                            >
                                <span className="material-symbols-outlined">schedule</span>
                                Ending Soon
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="auction-sort">
                            <label>Sort by:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="ending-soon">Ending Soon</option>
                                <option value="newest">Newest First</option>
                                <option value="highest-bid">Highest Bid</option>
                                <option value="lowest-bid">Lowest Bid</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="auction-results-header">
                        <h2>{filteredAuctions.length} Active Auctions</h2>
                        <button className="refresh-btn" onClick={fetchAuctions}>
                            <span className="material-symbols-outlined">refresh</span>
                            Refresh
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="auction-loading">
                            <div className="spinner"></div>
                            <p>Loading auctions...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="auction-error">
                            <span className="material-symbols-outlined">error</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Auction Grid */}
                    {!loading && filteredAuctions.length > 0 && (
                        <div className="auction-grid">
                            {filteredAuctions.map((auction) => {
                                const timeRemaining = getTimeRemaining(auction.endTime);

                                return (
                                    <div key={auction._id} className="auction-item">
                                        {/* Image */}
                                        <div className="auction-item-image">
                                            <img src={getAuctionImage(auction)} alt={auction.gemId?.title} />

                                            {/* Time Badge */}
                                            <div className={`auction-time-badge ${timeRemaining.urgent ? 'urgent' : ''} ${timeRemaining.ended ? 'ended' : ''}`}>
                                                <span className="material-symbols-outlined">schedule</span>
                                                {timeRemaining.text}
                                            </div>

                                            {/* Total Bids Badge */}
                                            <div className="auction-bids-badge">
                                                <span className="material-symbols-outlined">gavel</span>
                                                {auction.totalBids || 0} bids
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="auction-item-content">
                                            <h3 className="auction-item-title">
                                                {auction.gemId?.title || 'Untitled'}
                                            </h3>
                                            <p className="auction-item-details">
                                                {auction.gemId?.attributes?.carat || '0'} ct •
                                                {' '}{auction.gemId?.attributes?.cut || 'Cut'} •
                                                {' '}{auction.gemId?.attributes?.color || 'Color'}
                                            </p>

                                            {/* Pricing Info */}
                                            <div className="auction-pricing">
                                                <div className="auction-current-bid">
                                                    <span className="bid-label">Current Bid</span>
                                                    <span className="bid-amount">${auction.currentPrice?.toLocaleString() || '0'}</span>
                                                </div>
                                                <div className="auction-increment">
                                                    <span className="increment-label">Min. Increment</span>
                                                    <span className="increment-amount">${auction.minIncrement?.toLocaleString() || '0'}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="auction-actions">
                                                <button
                                                    className="btn-place-bid"
                                                    onClick={() => openBidModal(auction)}
                                                    disabled={timeRemaining.ended || !user}
                                                >
                                                    <span className="material-symbols-outlined">gavel</span>
                                                    {timeRemaining.ended ? 'Auction Ended' : 'Place Bid'}
                                                </button>
                                                <button className="btn-view-details">
                                                    <span className="material-symbols-outlined">visibility</span>
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && filteredAuctions.length === 0 && (
                        <div className="auction-no-results">
                            <span className="material-symbols-outlined">search_off</span>
                            <h3>No auctions found</h3>
                            <p>Try adjusting your filters or check back later</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bid Modal */}
            {showBidModal && selectedAuction && (
                <div className="modal-overlay" onClick={closeBidModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Place Your Bid</h2>
                            <button className="modal-close" onClick={closeBidModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Gemstone Info */}
                            <div className="modal-gem-info">
                                <img src={getAuctionImage(selectedAuction)} alt={selectedAuction.gemId?.title} />
                                <div>
                                    <h3>{selectedAuction.gemId?.title}</h3>
                                    <p>{selectedAuction.gemId?.attributes?.carat} ct • {selectedAuction.gemId?.attributes?.cut}</p>
                                </div>
                            </div>

                            {/* Current Bid Info */}
                            <div className="modal-bid-info">
                                <div className="info-row">
                                    <span>Current Bid:</span>
                                    <strong>${selectedAuction.currentPrice?.toLocaleString()}</strong>
                                </div>
                                <div className="info-row">
                                    <span>Minimum Increment:</span>
                                    <strong>${selectedAuction.minIncrement?.toLocaleString()}</strong>
                                </div>
                                <div className="info-row">
                                    <span>Your Wallet Balance:</span>
                                    <strong className="balance">$4,250.00</strong>
                                </div>
                            </div>

                            {/* Bid Form */}
                            <form onSubmit={handlePlaceBid} className="modal-bid-form">
                                <label>Your Bid Amount (USD)</label>
                                <div className="bid-input-wrapper">
                                    <span className="currency">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={selectedAuction.currentPrice + selectedAuction.minIncrement}
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="bid-hint">
                                    Minimum bid: ${(selectedAuction.currentPrice + selectedAuction.minIncrement).toLocaleString()}
                                </p>

                                {/* Quick Bid Buttons */}
                                <div className="quick-bids">
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((selectedAuction.currentPrice + selectedAuction.minIncrement).toFixed(2))}
                                    >
                                        Min Bid
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((selectedAuction.currentPrice + selectedAuction.minIncrement * 2).toFixed(2))}
                                    >
                                        +${selectedAuction.minIncrement * 2}
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((selectedAuction.currentPrice + selectedAuction.minIncrement * 5).toFixed(2))}
                                    >
                                        +${selectedAuction.minIncrement * 5}
                                    </button>
                                </div>

                                {/* Warning */}
                                <div className="bid-warning">
                                    <span className="material-symbols-outlined">info</span>
                                    <p>Your bid is a binding commitment to purchase if you win the auction.</p>
                                </div>

                                {/* Submit Button */}
                                <button type="submit" className="btn-confirm-bid">
                                    <span className="material-symbols-outlined">gavel</span>
                                    Confirm Bid
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="auction-footer">
                <div className="auction-footer-container">
                    <p>&copy; 2024 Ceylon Gems. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="#">Terms</a>
                        <a href="#">Privacy</a>
                        <a href="#">Help</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AuctionPage;