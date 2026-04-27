import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
//import { auctionAPI } from '../services/api';
import './AuctionPage.css';
import NavBar from "./NavBar.jsx";

const AuctionPage = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [auctions, setAuctions] = useState([]);
    const [upcomingAuctions, setUpcomingAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('ending-soon');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [bidLoading, setBidLoading] = useState(false);
    const [bidError, setBidError] = useState('');
    const [auctionBids, setAuctionBids] = useState([]);
    const [ws, setWs] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // WebSocket connection
    useEffect(() => {
        const websocket = new WebSocket('ws://localhost:5000');

        websocket.onopen = () => {
            console.log('✅ WebSocket connected');
            setWsConnected(true);
            setLoading(true);

            // Request initial auction data
            websocket.send(JSON.stringify({
                type: 'get-auctions'
            }));
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'auctions-data') {
                    console.log('📊 Received auctions data:', data.data.length);
                    setAuctions(data.data);
                    setLoading(false);
                    setError('');
                } else if (data.type === 'auction-updated') {
                    console.log('🔄 Auction updated:', data.data.auctionId);

                    // Update specific auction in state
                    setAuctions(prevAuctions =>
                        prevAuctions.map(auction =>
                            auction._id === data.data.auctionId
                                ? {
                                    ...auction,
                                    currentPrice: data.data.currentPrice,
                                    totalBids: data.data.totalBids,
                                    winnerId: data.data.winnerId
                                }
                                : auction
                        )
                    );

                    // If modal is open for this auction, update it too
                    if (selectedAuction && selectedAuction._id === data.data.auctionId) {
                        setSelectedAuction(prev => ({
                            ...prev,
                            currentPrice: data.data.currentPrice,
                            totalBids: data.data.totalBids,
                            winnerId: data.data.winnerId
                        }));
                    }
                }
            } catch (err) {
                console.error('❌ WebSocket message error:', err);
            }
        };

        websocket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            setError('Real-time connection failed');
            setWsConnected(false);
        };

        websocket.onclose = () => {
            console.log('❌ WebSocket disconnected');
            setWsConnected(false);
        };

        setWs(websocket);

        return () => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.close();
            }
        };
    }, []);

    // ✅ UPDATE TIME COUNTDOWN EVERY SECOND
    useEffect(() => {
        const timer = setInterval(() => {
            setUpdateTrigger(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch wallet balance on mount
    useEffect(() => {
        if (user) {
            fetchWalletBalance();
        }
    }, [user]);

    // Fetch upcoming auctions
    useEffect(() => {
        const fetchUpcomingAuctions = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auctions?status=scheduled');
                const data = await response.json();
                if (data.success) {
                    setUpcomingAuctions(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch upcoming auctions:', err);
            }
        };

        fetchUpcomingAuctions();
    }, []);

    const fetchWalletBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/wallet/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setBalance(data.data.balance);
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    // Fetch bids for selected auction
    const fetchAuctionBids = async (auctionId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/auctions/${auctionId}/bids`);
            const data = await response.json();
            if (data.success) {
                setAuctionBids(data.data.bids);
            }
        } catch (error) {
            console.error('Failed to fetch bids:', error);
        }
    };

    // Filter and sort auctions - COMBINED
    const getFilteredAndSortedAuctions = () => {
        let filtered = [];

        // Select data source based on filter
        if (filter === 'upcoming') {
            filtered = [...upcomingAuctions];
        } else {
            filtered = [...auctions];
        }

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
        if (filter === 'upcoming') {
            if (sortBy === 'ending-soon') {
                filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            } else if (sortBy === 'newest') {
                filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            } else if (sortBy === 'highest-bid') {
                filtered.sort((a, b) => b.startPrice - a.startPrice);
            } else if (sortBy === 'lowest-bid') {
                filtered.sort((a, b) => a.startPrice - b.startPrice);
            }
        } else {
            if (sortBy === 'ending-soon') {
                filtered.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
            } else if (sortBy === 'newest') {
                filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            } else if (sortBy === 'highest-bid') {
                filtered.sort((a, b) => b.currentPrice - a.currentPrice);
            } else if (sortBy === 'lowest-bid') {
                filtered.sort((a, b) => a.currentPrice - b.currentPrice);
            }
        }

        return filtered;
    };

    // Calculate time remaining - Called every second due to updateTrigger dependency
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

    // Calculate time until start for upcoming auctions
    const getTimeUntilStart = (startTime) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = start - now;

        if (diff <= 0) {
            return { started: true, text: 'Starting Soon' };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return { started: false, text: `Starts in ${days}d ${hours}h` };
        } else if (hours > 0) {
            return { started: false, text: `Starts in ${hours}h ${minutes}m` };
        } else if (minutes > 0) {
            return { started: false, text: `Starts in ${minutes}m ${seconds}s`, urgent: true };
        } else {
            return { started: false, text: `Starts in ${seconds}s`, urgent: true };
        }
    };


    // Open bid modal
    const openBidModal = (auction) => {
        setSelectedAuction(auction);
        const minBid = (parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toFixed(2);
        setBidAmount(minBid);
        setBidError('');
        fetchAuctionBids(auction._id);
        setShowBidModal(true);
    };

    // Close bid modal
    const closeBidModal = () => {
        setShowBidModal(false);
        setSelectedAuction(null);
        setBidAmount('');
        setBidError('');
        setBidLoading(false);
    };

    // Handle view gemstone details (redirect to gem listing page)
    const handleViewGemDetails = (gemId) => {
        navigate(`/gem/${gemId}`);
    };

    // Handle place bid
    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setBidError('');

        if (!user) {
            setBidError('You must be logged in to place a bid');
            return;
        }

        // Check if user is already the highest bidder
        if (selectedAuction.winnerId === user.id) {
            setBidError('You already have the highest bid on this auction');
            return;
        }

        if (!bidAmount || parseFloat(bidAmount) <= 0) {
            setBidError('Please enter a valid bid amount');
            return;
        }

        const minBid = parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement);

        if (parseFloat(bidAmount) < minBid) {
            setBidError(`Minimum bid is $${minBid.toFixed(2)}`);
            return;
        }

        if (parseFloat(bidAmount) > balance) {
            setBidError('Insufficient wallet balance');
            return;
        }

        setBidLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/auctions/${selectedAuction._id}/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bidAmount: parseFloat(bidAmount)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to place bid');
            }

            // Update wallet balance from response
            if (data.data.wallet) {
                setBalance(data.data.wallet.balance);
            }

            // Update auctions list with new bid info
            const updatedAuctions = auctions.map(auction =>
                auction._id === selectedAuction._id
                    ? data.data.auction
                    : auction
            );
            setAuctions(updatedAuctions);

            // Update selected auction in modal
            setSelectedAuction(data.data.auction);

            // Update auction bids
            setAuctionBids(data.data.allBids);

            // Don't close modal immediately - let user see updated prices
            setBidAmount((parseFloat(data.data.auction.currentPrice) + parseFloat(data.data.auction.minIncrement)).toFixed(2));

        } catch (err) {
            setBidError(err.message || 'Failed to place bid');
            console.error('Bid error:', err);
        } finally {
            setBidLoading(false);
        }
    };

    // Get auction image
    const getAuctionImage = (auction) => {
        if (auction.gemId && auction.gemId.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            // ✅ Use the full Cloudinary URL
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    const allFilteredAuctions = getFilteredAndSortedAuctions();
    const isUpcoming = filter === 'upcoming';

    return (
        <div className="auction-page">
            {/* Navigation Bar */}
            <NavBar user={user} onLogout={onLogout} balance={balance} />

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
                        <div className="auction-search">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Search auctions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

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
                            <button
                                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setFilter('upcoming')}
                            >
                                <span className="material-symbols-outlined">hourglass_empty</span>
                                Upcoming
                            </button>
                        </div>

                        <div className="auction-sort">
                            <label>Sort by:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="ending-soon">
                                    {isUpcoming ? 'Starting Soon' : 'Ending Soon'}
                                </option>
                                <option value="newest">Newest First</option>
                                <option value="highest-bid">
                                    {isUpcoming ? 'Highest Starting Price' : 'Highest Bid'}
                                </option>
                                <option value="lowest-bid">
                                    {isUpcoming ? 'Lowest Starting Price' : 'Lowest Bid'}
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="auction-results-header">
                        <h2>
                            {allFilteredAuctions.length} {isUpcoming ? 'Upcoming' : 'Active'} Auctions
                        </h2>
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
                    {!loading && allFilteredAuctions.length > 0 && (
                        <div className="auction-grid">
                            {allFilteredAuctions.map((auction) => {
                                const timeRemaining = isUpcoming
                                    ? getTimeUntilStart(auction.startTime)
                                    : getTimeRemaining(auction.endTime);

                                return (
                                    <div key={auction._id} className="auction-item">
                                        <div className="auction-item-image">
                                            <img src={getAuctionImage(auction)} alt={auction.gemId?.title} />

                                            <div className={`auction-time-badge ${timeRemaining.urgent ? 'urgent' : ''} ${timeRemaining.ended || timeRemaining.started ? 'ended' : ''}`}>
                                                <span className="material-symbols-outlined">schedule</span>
                                                {timeRemaining.text}
                                            </div>

                                            {!isUpcoming && (
                                                <div className="auction-bids-badge">
                                                    <span className="material-symbols-outlined">gavel</span>
                                                    {auction.totalBids || 0} bids
                                                </div>
                                            )}

                                            {isUpcoming && (
                                                <div className="auction-status-badge">
                                                    <span className="material-symbols-outlined">hourglass_empty</span>
                                                    Scheduled
                                                </div>
                                            )}
                                        </div>

                                        <div className="auction-item-content">
                                            <h3 className="auction-item-title">
                                                {auction.gemId?.title || 'Untitled'}
                                            </h3>
                                            <p className="auction-item-details">
                                                {auction.gemId?.attributes?.carat || '0'} ct •
                                                {' '}{auction.gemId?.attributes?.cut || 'Cut'} •
                                                {' '}{auction.gemId?.attributes?.color || 'Color'}
                                            </p>

                                            <div className="auction-pricing">
                                                <div className="auction-current-bid">
                                                    <span className="bid-label">
                                                        {isUpcoming ? 'Starting Bid' : 'Current Bid'}
                                                    </span>
                                                    <span className="bid-amount">
                                                        ${(isUpcoming ? auction.startPrice : auction.currentPrice)?.toLocaleString() || '0'}
                                                    </span>
                                                </div>
                                                <div className="auction-increment">
                                                    <span className="increment-label">
                                                        {isUpcoming ? 'Starts' : 'Min. Increment'}
                                                    </span>
                                                    <span className="increment-amount">
                                                        {isUpcoming
                                                            ? new Date(auction.startTime).toLocaleDateString()
                                                            : `$${auction.minIncrement?.toLocaleString() || '0'}`
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="auction-actions">
                                                {!isUpcoming && (
                                                    <button
                                                        className="btn-place-bid"
                                                        onClick={() => openBidModal(auction)}
                                                        disabled={
                                                            timeRemaining.ended ||
                                                            !user ||
                                                            auction.winnerId === user.id
                                                        }
                                                        title={auction.winnerId === user.id ? "You already have the highest bid" : ""}
                                                    >
                                                        <span className="material-symbols-outlined">gavel</span>
                                                        {timeRemaining.ended
                                                            ? 'Auction Ended'
                                                            : auction.winnerId === user.id
                                                                ? 'You are Winning'
                                                                : 'Place Bid'
                                                        }
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-view-details"
                                                    onClick={() => handleViewGemDetails(auction.gemId?._id)}
                                                >
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
                    {!loading && allFilteredAuctions.length === 0 && (
                        <div className="auction-no-results">
                            <span className="material-symbols-outlined">search_off</span>
                            <h3>No auctions found</h3>
                            <p>Try adjusting your filters or search terms</p>
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
                            <button className="modal-close" onClick={closeBidModal} disabled={bidLoading}>
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
                                    <strong className={balance < (parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement)) ? 'balance-low' : 'balance'}>
                                        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </strong>
                                </div>
                            </div>

                            {/* Error Message */}
                            {bidError && (
                                <div className="bid-error-message">
                                    <span className="material-symbols-outlined">error</span>
                                    {bidError}
                                </div>
                            )}

                            {/* Bid Form */}
                            <form onSubmit={handlePlaceBid} className="modal-bid-form">
                                <label>Your Bid Amount (USD)</label>
                                <div className="bid-input-wrapper">
                                    <span className="currency">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement)}
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        required
                                        disabled={bidLoading}
                                    />
                                </div>
                                <p className="bid-hint">
                                    Minimum bid: ${(parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>

                                {/* Quick Bid Buttons */}
                                <div className="quick-bids">
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement)).toFixed(2))}
                                        disabled={bidLoading}
                                    >
                                        Min Bid
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement) * 2).toFixed(2))}
                                        disabled={bidLoading}
                                    >
                                        +${(parseFloat(selectedAuction.minIncrement) * 2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-bid-btn"
                                        onClick={() => setBidAmount((parseFloat(selectedAuction.currentPrice) + parseFloat(selectedAuction.minIncrement) * 5).toFixed(2))}
                                        disabled={bidLoading}
                                    >
                                        +${(parseFloat(selectedAuction.minIncrement) * 5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </button>
                                </div>

                                {/* Bid History */}
                                {auctionBids.length > 0 && (
                                    <div className="bid-history">
                                        <h4>Recent Bids</h4>
                                        <div className="bids-list">
                                            {auctionBids.slice(0, 5).map((bid) => (
                                                <div key={bid._id} className="bid-item">
                                                    <span>{bid.bidderId?.name || 'Anonymous'}</span>
                                                    <span className="bid-time">
                                                        {new Date(bid.bidTime).toLocaleTimeString()}
                                                    </span>
                                                    <span className="bid-value">
                                                        ${parseFloat(bid.bidAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Warning */}
                                <div className="bid-warning">
                                    <span className="material-symbols-outlined">info</span>
                                    <p>Your bid amount will be held in your wallet until the auction ends. If you're outbid, your funds will be released immediately.</p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="btn-confirm-bid"
                                    disabled={bidLoading || !user}
                                >
                                    <span className="material-symbols-outlined">
                                        {bidLoading ? 'hourglass_empty' : 'gavel'}
                                    </span>
                                    {bidLoading ? 'Placing Bid...' : 'Confirm Bid'}
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