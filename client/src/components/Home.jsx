import React from 'react';
import './Home.css';

const Home = () => {
    return (
        <div className="page-wrapper">
            {/* Top Navigation */}
            <header className="header">
                <div className="header-container">
                    {/* Logo */}
                    <div className="logo-section">
                        <div className="logo-icon">
                            <span className="material-symbols-outlined">diamond</span>
                        </div>
                        <span className="logo-text">Ceylon Gems</span>
                    </div>

                    {/* Desktop Nav Links */}
                    <nav className="nav-links">
                        <a className="nav-link" href="#">Buy</a>
                        <a className="nav-link" href="#">Sell</a>
                        <a className="nav-link" href="#">Auctions</a>
                    </nav>

                    {/* Actions */}
                    <div className="header-actions">
                        {/* Wallet Display */}
                        <div className="wallet-display">
                            <span className="material-symbols-outlined wallet-icon">account_balance_wallet</span>
                            <span className="wallet-amount">$4,250</span>
                        </div>

                        {/* User Actions */}
                        <div className="user-actions">
                            <button className="icon-button">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <button className="icon-button user-button">
                                <span className="material-symbols-outlined">person</span>
                            </button>
                        </div>
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
                        <form className="search-form">
                            {/* Keyword Search */}
                            <div className="search-field">
                                <label className="search-label">Search</label>
                                <div className="search-input-wrapper">
                                    <span className="material-symbols-outlined search-icon">search</span>
                                    <input
                                        className="search-input"
                                        placeholder="Sapphire, Ruby, Emerald..."
                                        type="text"
                                    />
                                </div>
                            </div>

                            {/* Type */}
                            <div className="search-field">
                                <label className="search-label">Gem Type</label>
                                <select className="search-select">
                                    <option>All Types</option>
                                    <option>Blue Sapphire</option>
                                    <option>Padparadscha</option>
                                    <option>Ruby</option>
                                </select>
                            </div>

                            {/* Carat */}
                            <div className="search-field">
                                <label className="search-label">Carat</label>
                                <select className="search-select">
                                    <option>Any Weight</option>
                                    <option>0.5 - 1.0 ct</option>
                                    <option>1.0 - 2.0 ct</option>
                                    <option>2.0+ ct</option>
                                </select>
                            </div>

                            {/* Price */}
                            <div className="search-field">
                                <label className="search-label">Price Range</label>
                                <select className="search-select">
                                    <option>All Prices</option>
                                    <option>$100 - $1k</option>
                                    <option>$1k - $5k</option>
                                    <option>$5k+</option>
                                </select>
                            </div>

                            {/* Button */}
                            <div className="search-button-wrapper">
                                <button className="search-button" type="button">Search</button>
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

                        {/* Auction Grid */}
                        <div className="auction-grid">
                            {/* Auction Card 1 */}
                            <div className="auction-card">
                                <div className="auction-image-wrapper">
                                    <img
                                        className="auction-image"
                                        alt="Cut blue sapphire on a dark surface"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrzNC52QmNM-2wNLpAAhdDn6Oq97TInJNW46qV7wsjmf4X85zpqnL40pvI_t2XJbUw3GRsPc-L7ntdaotx9nkA7LlD4WLmq1RAJmjTK-Y46CRWC5RcBz9qCmt4oTVq_TylaHRFuGndFthldqUVT_nSquHPQok7dtkUxtPMe0sCsN4d8YGzJkX5sOk4_iTtMtzDYtGHklMdmVGkN9DuAL1a4-0L0xKEHxoW27CBOuBNGq7ZX3wimefxIe9g9QbtAg4dOuwZRrpPwa8"
                                    />
                                    <div className="auction-timer">
                                        <span className="material-symbols-outlined timer-icon">timer</span>
                                        04h 23m
                                    </div>
                                </div>
                                <div className="auction-content">
                                    <h3 className="auction-title">Royal Blue Sapphire</h3>
                                    <p className="auction-details">2.54 Carat • Oval Cut</p>
                                    <div className="auction-footer">
                                        <div>
                                            <p className="bid-label">Current Bid</p>
                                            <p className="bid-amount">$2,450</p>
                                        </div>
                                        <button className="bid-button">Bid Now</button>
                                    </div>
                                </div>
                            </div>

                            {/* Auction Card 2 */}
                            <div className="auction-card">
                                <div className="auction-image-wrapper">
                                    <img
                                        className="auction-image"
                                        alt="Red ruby gemstone on a white background"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ8U-24QGtfYn91kC0YjFaiH-V89d5ysJka4Z13-ta9xRE21r1b5yzNdrribzCy3PqtODAsXfpJ5ICVFEP8E0DkmEoeoRkMVhf0oY7NZRQhFQ_0p_s9Dvi_4n3PaisI6r5SFDFvVjhTbVVu59VmjzPK89eL1bs8zoaFGGjPqyQ57a049cxPF5RguilWWlyXwZpXEPTE9Of7op40xjZ_B2Ux8PUiUyy5AWzyvLOdT4DvI42VDtePGUvllyGJvRLAW6-5UapiZBiC2Y"
                                    />
                                    <div className="auction-timer">
                                        <span className="material-symbols-outlined timer-icon">timer</span>
                                        01h 12m
                                    </div>
                                </div>
                                <div className="auction-content">
                                    <h3 className="auction-title">Pigeon Blood Ruby</h3>
                                    <p className="auction-details">1.02 Carat • Cushion Cut</p>
                                    <div className="auction-footer">
                                        <div>
                                            <p className="bid-label">Current Bid</p>
                                            <p className="bid-amount">$5,100</p>
                                        </div>
                                        <button className="bid-button">Bid Now</button>
                                    </div>
                                </div>
                            </div>

                            {/* Auction Card 3 */}
                            <div className="auction-card">
                                <div className="auction-image-wrapper">
                                    <img
                                        className="auction-image"
                                        alt="Green emerald gemstone jewelry"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDrlRx6pcWk12jcjPqfwkatVa871YdQw3vDqKB0L6CHc39OEwqAfR7iG0jsq8owYN39wscJhf-VW89CNlqJ_rSr4dyv9caarhXGfuZwbZ3KoOZ0aPhL6rHzKaG9OKeZffs5f8LL_rIUCuMDggz0eC3qxUr2SfwPHMhigPl74j6B64C5xLnAvrtkds9L8GI762soVsjPaOmiqmrYXx-hUA3iQL1aDG-ILzoRmPj99rCW2DfVUOgeELB3LQ6zzNCVRyMjbk_p6-NC2s"
                                    />
                                    <div className="auction-timer">
                                        <span className="material-symbols-outlined timer-icon">timer</span>
                                        12h 45m
                                    </div>
                                </div>
                                <div className="auction-content">
                                    <h3 className="auction-title">Vivid Green Emerald</h3>
                                    <p className="auction-details">1.80 Carat • Emerald Cut</p>
                                    <div className="auction-footer">
                                        <div>
                                            <p className="bid-label">Current Bid</p>
                                            <p className="bid-amount">$3,800</p>
                                        </div>
                                        <button className="bid-button">Bid Now</button>
                                    </div>
                                </div>
                            </div>

                            {/* Auction Card 4 */}
                            <div className="auction-card">
                                <div className="auction-image-wrapper">
                                    <img
                                        className="auction-image"
                                        alt="Pink sapphire gemstone"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuByft5uU5CY_Pe2ULBNUP52eCN0QVsZMu_1Lm8LvVN0EEqHsXXhXm-cMvJgQVuXBt2drLEbA1Aaf0WF1fbCNsVMEkygyAk7DGf8uzEAXNFcS1Ig7mYC0YCSiqq9vENDjheMd76jugIoqE4uICJqHUt-sZ_DfO4rGVFD4mfTAoIKSLpyDzTA_r02QcNWZFGS1b2bGUPKcGByNVu3aeDF4F-OwQQqV1B0CtjefOfmEhrcgIMuikTZQtH5VpIOWbCAc2bMfNNf3HLBW8o"
                                    />
                                    <div className="auction-timer">
                                        <span className="material-symbols-outlined timer-icon">timer</span>
                                        00h 15m
                                    </div>
                                </div>
                                <div className="auction-content">
                                    <h3 className="auction-title">Pink Padparadscha</h3>
                                    <p className="auction-details">0.95 Carat • Round Cut</p>
                                    <div className="auction-footer">
                                        <div>
                                            <p className="bid-label">Current Bid</p>
                                            <p className="bid-amount">$8,900</p>
                                        </div>
                                        <button className="bid-button">Bid Now</button>
                                    </div>
                                </div>
                            </div>
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
                            {/* Featured Card 1 */}
                            <div className="featured-card">
                                <div className="featured-image-wrapper">
                                    <img
                                        className="featured-image"
                                        alt="Blue gemstone jewelry set"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgGSwhrdhOlVQ4hvu8UcGQdsmNIGWY9-lopkt6CaqKEK6ufBdN2OiH6uei0FS82ZqTRSUUzFv77mSEngo31zD1xnjIKfOIB2rgZ4xV0u36BuiuXjlltfnere59TTGeTm69CKboTIK8DcS3RMZHacHSann-s7pJpC7NNZh2kasY4AMTjFNpHfK0JnfvdtD1X9SGqxMexscvw3mazynSDyCD6_8eRrKfIgqypJZzLZ2ZGkGhYkDcLkqRAgzgX0ZcKw5rq8q2uOH1-JI"
                                    />
                                    <div className="featured-badge">Certified</div>
                                </div>
                                <div className="featured-content">
                                    <div className="featured-header">
                                        <h3 className="featured-title">Cornflower Blue Sapphire</h3>
                                        <span className="featured-price">$12,500</span>
                                    </div>
                                    <p className="featured-details">3.12 Carat • Cushion • GIA Certified</p>
                                    <div className="seller-info">
                                        <div className="seller-avatar gradient-purple-blue"></div>
                                        <span className="seller-name">GemLanka_Official</span>
                                        <span className="material-symbols-outlined verified-icon" title="Verified Seller">verified</span>
                                    </div>
                                </div>
                                <button className="view-details-button">View Details</button>
                            </div>

                            {/* Featured Card 2 */}
                            <div className="featured-card">
                                <div className="featured-image-wrapper">
                                    <img
                                        className="featured-image"
                                        alt="Yellow sapphire stone"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2F5K2tTvIeOYoRqTEODvVOLep1IDhqxXoXBTaSUK0Gi-XJaFTGDS8-B9f_7IegqUOrUnMPn-TvA_-OuviKNJPvY6GdVoKxaA-oZmZENrZ0JWCM8E55iWoqxaJmZZgHETCEKR7JNVoloYm3jSbcj3VPLOrGe0SlgVsj0vz-srFPu9CNB3Lf6b-ls5xlN0Dv6GLpNQUtS3wVQnUKEL9AXHtfT_MQxsOqGw_mxDw3PhnZeWm_GG6zb5Gc5I3USHoLFK6v1E35TEbXhU"
                                    />
                                    <div className="featured-badge">Certified</div>
                                </div>
                                <div className="featured-content">
                                    <div className="featured-header">
                                        <h3 className="featured-title">Yellow Sapphire (Pushparagam)</h3>
                                        <span className="featured-price">$3,200</span>
                                    </div>
                                    <p className="featured-details">1.50 Carat • Oval • Unheated</p>
                                    <div className="seller-info">
                                        <div className="seller-avatar gradient-yellow-orange"></div>
                                        <span className="seller-name">RoyalGems_LK</span>
                                        <span className="material-symbols-outlined verified-icon" title="Verified Seller">verified</span>
                                    </div>
                                </div>
                                <button className="view-details-button">View Details</button>
                            </div>

                            {/* Featured Card 3 */}
                            <div className="featured-card">
                                <div className="featured-image-wrapper">
                                    <img
                                        className="featured-image"
                                        alt="Purple spinel gemstone"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwWx7ggdTxNLPSWcCUvG4x_ExMahkaTDLTgozDGdYTlaPEbHv1hiFp8pmBXNk9btJKGV6Fe3Nn6JwadCcgfsfh99SrgtmOocJMzvNVd7ZqbVmmDtIh8ryc06imAHCVi9ALS3I7A2R1nboZOxf5fw1OlqVIurCaRPM1fdCtegKHBAGzAR-2qYDn5YdeXd5vI5ac3ECLS10xXRX09dU3WpQ1ioOWnCDymYnJc9UGe_OtF4IHTJO55-6e7clWEtYLW-CK3iUsPxH0wnQ"
                                    />
                                    <div className="featured-badge">Rare Find</div>
                                </div>
                                <div className="featured-content">
                                    <div className="featured-header">
                                        <h3 className="featured-title">Lavender Spinel</h3>
                                        <span className="featured-price">$1,850</span>
                                    </div>
                                    <p className="featured-details">2.10 Carat • Trillion • Clean</p>
                                    <div className="seller-info">
                                        <div className="seller-avatar gradient-indigo-pink"></div>
                                        <span className="seller-name">Ceylon_Miners</span>
                                    </div>
                                </div>
                                <button className="view-details-button">View Details</button>
                            </div>
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