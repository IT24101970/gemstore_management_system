import React, { useState, useEffect } from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import { gemstoneAPI, auctionAPI } from '../services/api';
import './Home.css';
import ProfileModal from './ProfileModal';
import './ProfileModal.css';

const Home = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [featuredGems, setFeaturedGems] = useState([]);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [balance, setBalance] = useState(0);
    const [showProfile, setShowProfile] = useState(false);

    // State for search filters
    const [searchFilters, setSearchFilters] = useState({
        keyword: '',
        type: 'All Types',
        carat: 'Any Weight',
        priceRange: 'All Prices'
    });

    // Fetch featured gems
    useEffect(() => {
        const fetchFeaturedGems = async () => {
            try {
                const response = await gemstoneAPI.getAll();
                setFeaturedGems(response.data);
            } catch (err) {
                setError('Failed to load featured gems');
                console.error(err);
            }
        };

        fetchFeaturedGems();
    }, []);

    // Fetch live auctions
    useEffect(() => {
        const fetchLiveAuctions = async () => {
            try {
                const response = await auctionAPI.getLive();
                setLiveAuctions(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load auctions');
                setLoading(false);
                console.error(err);
            }
        };

        fetchLiveAuctions();

        const interval = setInterval(fetchLiveAuctions, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchWalletBalance = async () => {
            try {
                const token = localStorage.getItem('token');  // Get JWT token from local storage
                const response = await fetch('http://localhost:5000/api/wallet/balance', {
                    headers: {
                        'Authorization': `Bearer ${token}`  // Send token for authentication
                    }
                });
                const data = await response.json();  // Convert response to JSON
                if (data.success) {
                    setBalance(data.data.balance);  // Update state with balance from DB
                }
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        if (user) {  // Only fetch if user is logged in
            fetchWalletBalance();
        }
    }, [user]);  // Re-fetch if user changes

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();

        const params = {};
        if (searchFilters.keyword) params.keyword = searchFilters.keyword;
        if (searchFilters.type !== 'All Types') params.type = searchFilters.type;

        if (searchFilters.carat !== 'Any Weight') {
            const caratMap = {
                '0.5 - 1.0 ct': '0.5-1.0',
                '1.0 - 2.0 ct': '1.0-2.0',
                '2.0+ ct': '2.0-999'
            };
            params.carat = caratMap[searchFilters.carat];
        }

        if (searchFilters.priceRange !== 'All Prices') {
            const priceMap = {
                '$100 - $1k': { min: 100, max: 1000 },
                '$1k - $5k': { min: 1000, max: 5000 },
                '$5k+': { min: 5000, max: 999999 }
            };
            const priceRange = priceMap[searchFilters.priceRange];
            if (priceRange) {
                params.priceMin = priceRange.min;
                params.priceMax = priceRange.max;
            }
        }

        try {
            setLoading(true);
            const response = await gemstoneAPI.search(params);
            setFeaturedGems(response.data);
            setLoading(false);
        } catch (err) {
            setError('Search failed');
            setLoading(false);
            console.error(err);
        }
    };

    // Get primary image or placeholder
    const getGemImage = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find(img => img.isPrimary);
            const imgUrl = primaryImage ? primaryImage.url : gem.images[0].url;
            if (imgUrl && imgUrl.startsWith('http')) return imgUrl;
            return `http://localhost:5000/uploads/${imgUrl}`;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    // Get auction image
    // In HomePage.jsx, AuctionPage.jsx, or wherever gemstones display:

    const getAuctionImage = (auction) => {
        if (auction.gemId && auction.gemId.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            // ✅ Use the full Cloudinary URL
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    // Calculate time remaining
    const getTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return 'Ended';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="home-page">
            {/* Header */}
            <header className="home-header">
                <div className="home-header-container">
                    <div className="home-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    <nav className="home-nav">
                        <Link to="/home" className="nav-item active">Home</Link>
                        <Link to="/auction" className="nav-item">Auctions</Link>
                        <Link to="/eventListing" className="nav-item ">Events</Link>
                        {user && user.role === 'seller' && (
                            <Link to="/seller/dashboard" className="nav-item">My Listings</Link>
                        )}
                    </nav>

                    <div className="home-user-actions">
                        {user ? (
                            <>
                                <div className="home-wallet" onClick={() => navigate('/wallet')} style={{ cursor: 'pointer' }}>
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                    <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div> 
                                <button className="home-icon-btn">
                                    <span className="material-symbols-outlined">notifications</span>
                                </button>
                                {/*<button className="home-icon-btn">*/}
                                {/*    <span className="material-symbols-outlined">person</span>*/}
                                {/*</button>*/}
                                <button className="home-icon-btn" onClick={() => setShowProfile(true)}>
                                    <span className="material-symbols-outlined">person</span>
                                </button>
                                <button onClick={onLogout} className="home-logout-btn">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="home-login-link">Login</Link>
                                <Link to="/register" className="home-register-link">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="home-hero">
                <div className="home-hero-container">
                    <div className="home-hero-card">
                        <div className="home-hero-background">
                            <div className="home-hero-image" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAFvXyaay0_V0cBsSAZpp9SsJ2SFVTRqevbGKHKywxpGXf3Or0JNSHflxe7wzDaTKJ8bzGtiiyoPeYQhtMZI-NkK0EJ58Tj5h9x5NlouoWoY-x1G_fUXizLci8AKXeVr7SMxGZkaOxcOLPQS-2sViRdnildxolxBc-6AU8kI3FUUxa3cBoqzp6EHp8z1-4opYpb-PSNkJ7altaVMY5nXLSIn7OGJcy-jg2AWXpuCARdVbIp2sNwy_iper_jGzuPkok-0V_MlmF3egU')"}}></div>
                            <div className="home-hero-overlay"></div>
                        </div>
                        <div className="home-hero-content">
                            <h1 className="home-hero-title">
                                The Heart of <br />
                                <span className="home-hero-accent">Ceylon's Earth</span>
                            </h1>
                            <p className="home-hero-description">
                                Trade authentic Sri Lankan gemstones with confidence. Access a curated marketplace of verified sapphires, rubies, and rare minerals directly from the source.
                            </p>
                            <div className="home-hero-buttons">
                                <button className="home-btn-primary">Explore Collection</button>
                                <button className="home-btn-secondary">Start Selling</button>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="home-search-bar">
                        <form onSubmit={handleSearch} className="home-search-form">
                            <div className="home-search-field">
                                <label className="home-search-label">SEARCH</label>
                                <div className="home-search-input-wrapper">
                                    <span className="material-symbols-outlined">search</span>
                                    <input
                                        type="text"
                                        placeholder="Sapphire, Ruby..."
                                        value={searchFilters.keyword}
                                        onChange={(e) => setSearchFilters({...searchFilters, keyword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="home-search-field">
                                <label className="home-search-label">GEM TYPE</label>
                                <select
                                    value={searchFilters.type}
                                    onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value})}
                                >
                                    <option>All Types</option>
                                    <option>Sapphire</option>
                                    <option>Padparadscha</option>
                                    <option>Ruby</option>
                                    <option>Emerald</option>
                                </select>
                            </div>

                            <div className="home-search-field">
                                <label className="home-search-label">CARAT</label>
                                <select
                                    value={searchFilters.carat}
                                    onChange={(e) => setSearchFilters({...searchFilters, carat: e.target.value})}
                                >
                                    <option>Any Weight</option>
                                    <option>0.5 - 1.0 ct</option>
                                    <option>1.0 - 2.0 ct</option>
                                    <option>2.0+ ct</option>
                                </select>
                            </div>

                            <div className="home-search-field">
                                <label className="home-search-label">PRICE RANGE</label>
                                <select
                                    value={searchFilters.priceRange}
                                    onChange={(e) => setSearchFilters({...searchFilters, priceRange: e.target.value})}
                                >
                                    <option>All Prices</option>
                                    <option>$100 - $1k</option>
                                    <option>$1k - $5k</option>
                                    <option>$5k+</option>
                                </select>
                            </div>

                            <button type="submit" className="home-search-btn">Search</button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="home-main">
                <div className="home-container">
                    {/* Live Auctions */}
                    <section className="home-section">
                        <div className="home-section-header">
                            <div>
                                <h2 className="home-section-title">
                                    <span className="material-symbols-outlined live-icon">sensors</span>
                                    Live Auctions
                                </h2>
                                <p className="home-section-subtitle">Bid on exclusive stones in real-time.</p>
                            </div>
                            <Link to="/auction" className="home-view-all">
                                View all auctions
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                        </div>

                        {loading && liveAuctions.length === 0 ? (
                            <div className="home-loading">Loading auctions...</div>
                        ) : liveAuctions.length > 0 ? (
                            <div className="home-auction-grid">
                                {liveAuctions.slice(0, 4).map((auction) => (
                                    <div key={auction._id} className="home-auction-card">
                                        <div className="home-auction-image">
                                            <img src={getAuctionImage(auction)} alt={auction.gemId?.title} />
                                            <div className="home-auction-timer">
                                                <span className="material-symbols-outlined">schedule</span>
                                                {getTimeRemaining(auction.endTime)}
                                            </div>
                                        </div>
                                        <div className="home-auction-content">
                                            <h3 className="home-auction-title">{auction.gemId?.title || 'Untitled'}</h3>
                                            <p className="home-auction-details">
                                                {auction.gemId?.attributes?.carat || '0'} Carat • {auction.gemId?.attributes?.cut || 'Cut'}
                                            </p>
                                            <div className="home-auction-footer">
                                                <div>
                                                    <p className="home-bid-label">CURRENT BID</p>
                                                    <p className="home-bid-amount">${auction.currentPrice?.toLocaleString() || '0'}</p>
                                                </div>
                                                <button className="home-bid-btn">Bid Now</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="home-no-results">No live auctions at the moment.</div>
                        )}
                    </section>

                    {/* Featured Gems */}
                    <section className="home-section">
                        <div className="home-section-header">
                            <div>
                                <h2 className="home-section-title">Featured Gems</h2>
                                <p className="home-section-subtitle">Handpicked for exceptional clarity and color.</p>
                            </div>
                            <div className="home-filter-tabs">
                                <button
                                    className={`home-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    All
                                </button>
                                <button
                                    className={`home-filter-tab ${activeFilter === 'sapphires' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('sapphires')}
                                >
                                    Sapphires
                                </button>
                                <button
                                    className={`home-filter-tab ${activeFilter === 'rubies' ? 'active' : ''}`}
                                    onClick={() => setActiveFilter('rubies')}
                                >
                                    Rubies
                                </button>
                            </div>
                        </div>

                        {featuredGems.length > 0 ? (
                            <div className="home-gems-grid">
                                {featuredGems.filter(gem => {
                                    if (activeFilter === 'all') return true;
                                    if (activeFilter === 'sapphires' && gem.type) return gem.type.toLowerCase().includes('sapphire');
                                    if (activeFilter === 'rubies' && gem.type) return gem.type.toLowerCase().includes('ruby');
                                    return true;
                                }).map((gem) => (
                                    <div key={gem._id} className="home-gem-card">
                                        <div className="home-gem-image">
                                            <img src={getGemImage(gem)} alt={gem.title} onError={(e) => { e.target.onerror = null; e.target.src = "https://dummyimage.com/400x300/cccccc/ffffff?text=No+Image"; }} />
                                            {(gem.report || (gem.certifications && gem.certifications.length > 0)) && (
                                                <div className="home-gem-badge">Certified</div>
                                            )}
                                        </div>
                                        <div className="home-gem-content">
                                            <h3 className="home-gem-title">{gem.title}</h3>
                                            <p className="home-gem-details">
                                                {gem.attributes?.carat || '0'} Carat • {gem.attributes?.cut || 'Cut'}
                                            </p>
                                            <div className="home-gem-footer">
                                                <span className="home-gem-price" style={{ marginBottom: "0" }}>${gem.price?.toLocaleString() || '0'}</span>
                                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                    <button 
                                                        className="home-buy-btn" 
                                                        style={{ flex: 1, opacity: gem.status === 'sold' ? 0.5 : 1, cursor: gem.status === 'sold' ? 'not-allowed' : 'pointer' }}
                                                        disabled={gem.status === 'sold'}
                                                        onClick={() => navigate(`/checkout/gem/${gem._id}`)}
                                                    >
                                                        {gem.status === 'sold' ? 'Sold Out' : 'Buy Now'}
                                                    </button>
                                                    <button className="home-view-btn" style={{ flex: 1 }} onClick={() => navigate(`/gem/${gem._id}`)}>View</button>
                                                </div>
                                            </div>
                                            {/*<div style={{
                                                marginTop: "15px", 
                                                padding: "8px", 
                                                textAlign: "center", 
                                                borderRadius: "6px", 
                                                fontWeight: "bold",
                                                color: "white",
                                                fontSize: "12px",
                                                letterSpacing: "1px",
                                                textTransform: "uppercase",
                                                background: gem.status === "sold" ? "linear-gradient(135deg, #94a3b8 0%, #0f172a 100%)" : "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)"
                                            }}>
                                                {gem.status || 'available'}
                                            </div>*/}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            !loading && <div className="home-no-results">No gems available at the moment.</div>
                        )}
                    </section>
                </div>
            </div>

            {/* Footer */}
            <footer className="home-footer">
                <div className="home-footer-container">
                    <p>&copy; 2024 Ceylon Gems. All rights reserved.</p>
                    <div className="home-footer-links">
                        <a href="#">Terms</a>
                        <a href="#">Privacy</a>
                        <a href="#">Help</a>
                    </div>
                </div>
            </footer>

            {showProfile && (
                <ProfileModal
                    user={user}
                    onClose={() => setShowProfile(false)}
                    onUpdate={(updatedUser) => {
                        // Optional: update local user state if needed
                        console.log('Profile updated:', updatedUser);
                    }}
                />
            )}
        </div>
    );
};

export default Home;
