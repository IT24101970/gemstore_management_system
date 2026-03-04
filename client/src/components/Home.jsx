import React, { useState, useEffect } from 'react';
import { gemstoneAPI, auctionAPI } from '../services/api';
import './Home.css';

const Home = ({ user, onNavigateToLogin, onNavigateToRegister, onLogout }) => {
    // State for data
    const [featuredGems, setFeaturedGems] = useState([]);
    const [liveAuctions, setLiveAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

        // Refresh auctions every minute
        const interval = setInterval(fetchLiveAuctions, 60000);
        return () => clearInterval(interval);
    }, []);

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();

        const params = {};
        if (searchFilters.keyword) params.keyword = searchFilters.keyword;
        if (searchFilters.type !== 'All Types') params.type = searchFilters.type;

        // Parse carat range
        if (searchFilters.carat !== 'Any Weight') {
            const caratMap = {
                '0.5 - 1.0 ct': '0.5-1.0',
                '1.0 - 2.0 ct': '1.0-2.0',
                '2.0+ ct': '2.0-999'
            };
            params.carat = caratMap[searchFilters.carat];
        }

        // Parse price range
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
            return primaryImage ? primaryImage.url : gem.images[0].url;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    // Get auction image
    const getAuctionImage = (auction) => {
        if (auction.gemId && auction.gemId.images && auction.gemId.images.length > 0) {
            const primaryImage = auction.gemId.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : auction.gemId.images[0].url;
        }
        return 'https://via.placeholder.com/400x300?text=No+Image';
    };

    return (
        <div className="page-wrapper">
            {/* Top Navigation */}
            <header className="header">
                <div className="header-actions">
                    {user && (
                        <div className="wallet-display">
                            <span className="material-symbols-outlined wallet-icon">account_balance_wallet</span>
                            <span className="wallet-amount">$4,250</span>
                        </div>
                    )}

                    <div className="user-actions">
                        {user ? (
                            <>
                                <button className="icon-button">
                                    <span className="material-symbols-outlined">notifications</span>
                                </button>
                                <button className="icon-button user-button">
                                    <span className="material-symbols-outlined">person</span>
                                </button>
                                <button onClick={onLogout} className="logout-button">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="login-button">
                                    Login
                                </Link>
                                <Link to="/register" className="register-button">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-container">
                        <div className="hero-card">
                            {/* Hero Background Image */}
                            <div className="hero-background">
                                <div
                                    className="hero-image"
                                    style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAFvXyaay0_V0cBsSAZpp9SsJ2SFVTRqevbGKHKywxpGXf3Or0JNSHflxe7wzDaTKJ8bzGtiiyoPeYQhtMZI-NkK0EJ58Tj5h9x5NlouoWoY-x1G_fUXizLci8AKXeVr7SMxGZkaOxcOLPQS-2sViRdnildxolxBc-6AU8kI3FUUxa3cBoqzp6EHp8z1-4opYpb-PSNkJ7altaVMY5nXLSIn7OGJcy-jg2AWXpuCARdVbIp2sNwy_iper_jGzuPkok-0V_MlmF3egU')"}}
                                ></div>
                                {/* Gradient Overlay */}
                                <div className="hero-overlay"></div>
                            </div>

                            {/* Hero Content */}
                            <div className="hero-content">
                                <h1 className="hero-title">
                                    The Heart of <br /> <span className="hero-title-accent">Ceylon's Earth</span>
                                </h1>
                                <p className="hero-description">
                                    Trade authentic Sri Lankan gemstones with confidence. Access a curated marketplace of verified sapphires, rubies, and rare minerals directly from the source.
                                </p>
                                <div className="hero-buttons">
                                    <button className="btn btn-primary">Explore Collection</button>
                                    <button className="btn btn-secondary">Start Selling</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Advanced Search Filter */}
                <section className="search-section">
                    <div className="search-container">
                        <form className="search-form" onSubmit={handleSearch}>
                            {/* Keyword Search */}
                            <div className="search-field">
                                <label className="search-label">Search</label>
                                <div className="search-input-wrapper">
                                    <span className="material-symbols-outlined search-icon">search</span>
                                    <input
                                        className="search-input"
                                        placeholder="Sapphire, Ruby, Emerald..."
                                        type="text"
                                        value={searchFilters.keyword}
                                        onChange={(e) => setSearchFilters({...searchFilters, keyword: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="search-field">
                                <label className="search-label">Gem Type</label>
                                <select
                                    className="search-select"
                                    value={searchFilters.type}
                                    onChange={(e) => setSearchFilters({...searchFilters, type: e.target.value})}
                                >
                                    <option>All Types</option>
                                    <option>Blue Sapphire</option>
                                    <option>Padparadscha</option>
                                    <option>Ruby</option>
                                    <option>Yellow Sapphire</option>
                                    <option>Emerald</option>
                                </select>
                            </div>

                            {/* Carat */}
                            <div className="search-field">
                                <label className="search-label">Carat</label>
                                <select
                                    className="search-select"
                                    value={searchFilters.carat}
                                    onChange={(e) => setSearchFilters({...searchFilters, carat: e.target.value})}
                                >
                                    <option>Any Weight</option>
                                    <option>0.5 - 1.0 ct</option>
                                    <option>1.0 - 2.0 ct</option>
                                    <option>2.0+ ct</option>
                                </select>
                            </div>

                            {/* Price */}
                            <div className="search-field">
                                <label className="search-label">Price Range</label>
                                <select
                                    className="search-select"
                                    value={searchFilters.priceRange}
                                    onChange={(e) => setSearchFilters({...searchFilters, priceRange: e.target.value})}
                                >
                                    <option>All Prices</option>
                                    <option>$100 - $1k</option>
                                    <option>$1k - $5k</option>
                                    <option>$5k+</option>
                                </select>
                            </div>

                            {/* Button */}
                            <div className="search-button-wrapper">
                                <button className="search-button" type="submit">Search</button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Live Auctions Section */}
                <section className="auctions-section">
                    <div className="section-container">
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">
                                    <span className="material-symbols-outlined live-icon">sensors</span>
                                    Live Auctions
                                </h2>
                                <p className="section-subtitle">Bid on exclusive stones in real-time.</p>
                            </div>
                            <a className="view-all-link" href="#">
                                View all auctions <span className="material-symbols-outlined arrow-icon">arrow_forward</span>
                            </a>
                        </div>

                        {/* Loading State */}
                        {loading && liveAuctions.length === 0 && (
                            <div className="loading-message">Loading auctions...</div>
                        )}

                        {/* Error State */}
                        {error && !loading && liveAuctions.length === 0 && (
                            <div className="error-message">{error}</div>
                        )}

                        {/* Auction Grid */}
                        <div className="auction-grid">
                            {liveAuctions.length > 0 ? (
                                liveAuctions.map((auction) => (
                                    <div key={auction._id} className="auction-card">
                                        <div className="auction-image-wrapper">
                                            <img
                                                className="auction-image"
                                                alt={auction.gemId?.title || 'Gemstone'}
                                                src={getAuctionImage(auction)}
                                            />
                                            <div className="auction-timer">
                                                <span className="material-symbols-outlined timer-icon">timer</span>
                                                {auction.timeRemaining?.formatted || '00h 00m'}
                                            </div>
                                        </div>
                                        <div className="auction-content">
                                            <h3 className="auction-title">{auction.gemId?.title || 'Untitled'}</h3>
                                            <p className="auction-details">
                                                {auction.gemId?.attributes?.carat || '0'} Carat • {auction.gemId?.attributes?.cut || 'Cut'}
                                            </p>
                                            <div className="auction-footer">
                                                <div>
                                                    <p className="bid-label">Current Bid</p>
                                                    <p className="bid-amount">${auction.currentPrice?.toLocaleString() || '0'}</p>
                                                </div>
                                                <button className="bid-button">Bid Now</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                !loading && <div className="no-data-message">No live auctions at the moment.</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Featured Gems Section */}
                <section className="featured-section">
                    <div className="section-container">
                        <div className="section-header">
                            <div>
                                <h2 className="section-title">Featured Gems</h2>
                                <p className="section-subtitle">Handpicked for exceptional clarity and color.</p>
                            </div>
                            {/* Filter Tabs */}
                            <div className="filter-tabs">
                                <button className="filter-tab active">All</button>
                                <button className="filter-tab">Sapphires</button>
                                <button className="filter-tab">Rubies</button>
                            </div>
                        </div>

                        {/* Featured Grid */}
                        <div className="featured-grid">
                            {featuredGems.length > 0 ? (
                                featuredGems.map((gem) => (
                                    <div key={gem._id} className="featured-card">
                                        <div className="featured-image-wrapper">
                                            <img
                                                className="featured-image"
                                                alt={gem.title}
                                                src={getGemImage(gem)}
                                            />
                                            {gem.certifications && gem.certifications.length > 0 && (
                                                <div className="featured-badge">Certified</div>
                                            )}
                                        </div>
                                        <div className="featured-content">
                                            <div className="featured-header">
                                                <h3 className="featured-title">{gem.title}</h3>
                                                <span className="featured-price">${gem.price?.toLocaleString() || '0'}</span>
                                            </div>
                                            <p className="featured-details">
                                                {gem.attributes?.carat || '0'} Carat • {gem.attributes?.cut || 'Cut'}
                                                {gem.certifications?.[0]?.type && ` • ${gem.certifications[0].type} Certified`}
                                            </p>
                                            <div className="seller-info">
                                                <div className="seller-avatar gradient-purple-blue"></div>
                                                <span className="seller-name">{gem.sellerId?.name || 'Seller'}</span>
                                                <span className="material-symbols-outlined verified-icon" title="Verified Seller">verified</span>
                                            </div>
                                        </div>
                                        <button className="view-details-button">View Details</button>
                                    </div>
                                ))
                            ) : (
                                !loading && <div className="no-data-message">No gems available at the moment.</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Seller CTA */}
                <section className="cta-section">
                    <div className="cta-card">
                        {/* Background Pattern */}
                        <div
                            className="cta-background"
                            style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7do9hk2TUihNkMWRfQjzZ9YLPKwoiGKKE9lXMM-aGuvewW46Pf8Vt6aq0dsEjkDZEN6WQzly1y5g66ZrUdEkhuhj8Tay-7JFIvai9GKOQ5hEGder0xR77F_lgq91Uyw8GLjMTT_AARCoGhg_Ng-QUrziKHizh6tIa3LdqYcMj5LlPhAQtJyZ1gp4tinYIBcgi4RtgPI_FRbq3DI0Tv_6ut_IsnY7yP1z0wfAabBN-GJ_BsKF3pWD1mhvZU3PqKXb8KoPSKI_hxgo')"}}
                        ></div>
                        <div className="cta-overlay"></div>

                        <div className="cta-content">
                            <div className="cta-badge">
                                <span className="material-symbols-outlined">storefront</span>
                                <span className="cta-badge-text">For Miners & Dealers</span>
                            </div>
                            <h2 className="cta-title">
                                Mine to Market. <br /> List your gems on the world's most trusted platform.
                            </h2>
                            <p className="cta-description">
                                Join over 500+ verified Sri Lankan merchants selling to global collectors. Low commission fees and secure payments.
                            </p>
                            <button className="cta-button">
                                Become a Seller
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <span className="material-symbols-outlined footer-logo-icon">diamond</span>
                                <span className="footer-logo-text">Ceylon Gems</span>
                            </div>
                            <p className="footer-description">
                                The premier digital marketplace for authentic Sri Lankan gemstones. Connecting local miners and lapidaries with the world.
                            </p>
                            <div className="social-links">
                                <div className="social-icon">
                                    <span>FB</span>
                                </div>
                                <div className="social-icon">
                                    <span>IG</span>
                                </div>
                                <div className="social-icon">
                                    <span>X</span>
                                </div>
                            </div>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Marketplace</h3>
                            <ul className="footer-links">
                                <li><a href="#">Buy Gems</a></li>
                                <li><a href="#">Live Auctions</a></li>
                                <li><a href="#">Sell Gems</a></li>
                                <li><a href="#">Verify Certificate</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Support</h3>
                            <ul className="footer-links">
                                <li><a href="#">Help Center</a></li>
                                <li><a href="#">Gemology Guide</a></li>
                                <li><a href="#">Shipping & Insurance</a></li>
                                <li><a href="#">Dispute Resolution</a></li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Company</h3>
                            <ul className="footer-links">
                                <li><a href="#">About Us</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                                <li><a href="#">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <p className="footer-copyright">© 2024 Ceylon Gems Marketplace. All rights reserved.</p>
                        <div className="payment-icons">
                            <span className="material-symbols-outlined">credit_card</span>
                            <span className="material-symbols-outlined">account_balance</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;