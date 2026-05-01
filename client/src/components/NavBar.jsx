import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ user, onLogout, balance = 0 }) => {
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close mobile menu when navigating
    const handleNavClick = (path) => {
        setIsMobileOpen(false);
        navigate(path);
    };

    return (
        <>
            {/* Navbar */}
            <header className="navbar">
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="navbar-logo" onClick={() => handleNavClick('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="navbar-nav">
                        <Link to="/home" className="nav-item">Home</Link>
                        <Link to="/auction" className="nav-item">Auctions</Link>
                        <Link to="/eventListing" className="nav-item">Events</Link>

                        {/* Show "My Listings" only for sellers */}
                        {user && user.role === 'seller' && (
                            <Link to="/seller/dashboard" className="nav-item">My Listings</Link>
                        )}
                    </nav>

                    {/* User Actions */}
                    <div className="navbar-actions">
                        {user ? (
                            <>
                                {/* Wallet */}
                                <div
                                    className="navbar-wallet"
                                    onClick={() => handleNavClick('/wallet')}
                                    title="View Wallet"
                                >
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                    <span>${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                {/* Profile */}
                                <button
                                    className="navbar-icon-btn"
                                    onClick={() => handleNavClick('/profile')}
                                    title="View Profile"
                                >
                                    <span className="material-symbols-outlined">person</span>
                                </button>

                                {/* Logout */}
                                <button
                                    onClick={onLogout}
                                    className="navbar-logout-btn"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="navbar-login-link">Login</Link>
                                <Link to="/register" className="navbar-register-link">Register</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="navbar-mobile-toggle"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        title="Toggle Menu"
                    >
                        <span className="material-symbols-outlined">
                            {isMobileOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileOpen && (
                <div className="navbar-mobile-menu">
                    <Link to="/home" className="mobile-nav-item" onClick={() => setIsMobileOpen(false)}>
                        Home
                    </Link>
                    <Link to="/auction" className="mobile-nav-item" onClick={() => setIsMobileOpen(false)}>
                        Auctions
                    </Link>
                    <Link to="/eventListing" className="mobile-nav-item" onClick={() => setIsMobileOpen(false)}>
                        Events
                    </Link>

                    {user && user.role === 'seller' && (
                        <Link to="/seller/dashboard" className="mobile-nav-item" onClick={() => setIsMobileOpen(false)}>
                            My Listings
                        </Link>
                    )}

                    {user && (
                        <>
                            <hr className="mobile-nav-divider" />
                            <div
                                className="mobile-nav-item"
                                onClick={() => handleNavClick('/wallet')}
                            >
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <button
                                className="mobile-nav-item"
                                onClick={() => handleNavClick('/profile')}
                            >
                                <span className="material-symbols-outlined">person</span>
                                Profile
                            </button>
                            <button
                                onClick={onLogout}
                                className="mobile-logout-btn"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default NavBar;