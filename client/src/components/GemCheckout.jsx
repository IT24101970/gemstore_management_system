import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI, gemstoneAPI, walletAPI } from '../services/api';
import './GemCheckout.css';

const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

const GemCheckout = ({ user, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [gem, setGem] = useState(null);
    const [wallet, setWallet] = useState({ availableBalance: 0, fundsOnHold: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Sri Lanka',
    });

    useEffect(() => {
        const loadCheckoutData = async () => {
            setLoading(true);
            setError('');

            try {
                const [gemResponse, walletSummary, profileResponse] = await Promise.all([
                    gemstoneAPI.getById(id),
                    walletAPI.getSummary(),
                    authAPI.getMe(),
                ]);

                setGem(gemResponse.data);
                setWallet(walletSummary || { availableBalance: 0, fundsOnHold: 0 });
                setAddress(profileResponse?.user?.shippingAddress || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Sri Lanka',
                });
            } catch (loadError) {
                setError(loadError.message || 'Failed to load checkout details.');
            } finally {
                setLoading(false);
            }
        };

        loadCheckoutData();
    }, [id]);

    const gemImage = useMemo(() => {
        if (!gem?.images?.length) {
            return 'https://via.placeholder.com/800x520?text=No+Image';
        }

        const primary = gem.images.find((img) => img.isPrimary) || gem.images[0];
        if (!primary?.url) {
            return 'https://via.placeholder.com/800x520?text=No+Image';
        }

        return primary.url.startsWith('http')
            ? primary.url
            : `http://localhost:5000/uploads/${primary.url}`;
    }, [gem]);

    const gemPrice = Number(gem?.price) || 0;
    const availableBalance = Number(wallet?.availableBalance) || 0;
    const canPurchase = Boolean(
        gem &&
        gem.status === 'available' &&
        gem.sellingMethod === 'instantPurchase' &&
        gemPrice > 0 &&
        availableBalance >= gemPrice &&
        address.street.trim() &&
        address.city.trim()
    );

    const balanceAfterPurchase = availableBalance - gemPrice;

    const handleAddressChange = (event) => {
        const { name, value } = event.target;
        setAddress((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleConfirmPurchase = async () => {
        if (!gem) return;

        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const normalizedAddress = {
                street: address.street.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                postalCode: address.postalCode.trim(),
                country: address.country.trim() || 'Sri Lanka',
            };

            if (!normalizedAddress.street || !normalizedAddress.city) {
                setError('Street and city are required before confirming this order.');
                setSubmitting(false);
                return;
            }

            await authAPI.updateAddress(normalizedAddress);
            const result = await gemstoneAPI.purchase(gem._id, normalizedAddress);
            setSuccessMessage(result?.message || 'Purchase completed successfully.');
            setAddress(normalizedAddress);

            if (result?.order?.shippingAddress) {
                setAddress(result.order.shippingAddress);
            }

            if (result?.gemstone) {
                setGem(result.gemstone);
            } else {
                setGem((current) => current ? { ...current, status: 'sold' } : current);
            }

            if (result?.wallet) {
                setWallet({
                    availableBalance: result.wallet.availableBalance,
                    fundsOnHold: result.wallet.heldFunds,
                });
            } else {
                setWallet((current) => ({
                    ...current,
                    availableBalance: Math.max(current.availableBalance - gemPrice, 0),
                }));
            }
        } catch (purchaseError) {
            setError(purchaseError.message || 'Purchase failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="checkout-state">
                <div className="spinner"></div>
                <p>Loading checkout details...</p>
            </div>
        );
    }

    if (error && !gem) {
        return (
            <div className="checkout-state error">
                <span className="material-symbols-outlined">error</span>
                <h2>Checkout unavailable</h2>
                <p>{error}</p>
                <Link to="/home" className="checkout-link-btn">Return to dashboard</Link>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <header className="home-header">
                <div className="home-header-container">
                    <div className="home-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    <nav className="home-nav">
                        <Link to="/home" className="nav-item">Home</Link>
                        <Link to="/auction" className="nav-item">Auctions</Link>
                        <Link to="/eventListing" className="nav-item">Events</Link>
                        {user && user.role === 'seller' && (
                            <Link to="/seller/dashboard" className="nav-item">My Listings</Link>
                        )}
                    </nav>

                    <div className="home-user-actions">
                        <Link to="/wallet" className="home-wallet" aria-label="Open wallet">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                            <span>{availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </Link>
                        <button onClick={onLogout} className="home-logout-btn">Logout</button>
                    </div>
                </div>
            </header>

            <main className="checkout-main">
                <div className="checkout-shell">
                    <div className="checkout-breadcrumb">
                        <Link to="/home">Home</Link>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <Link to={`/gem/${gem?._id}`}>Gem Details</Link>
                        <span className="material-symbols-outlined">chevron_right</span>
                        <span>Checkout</span>
                    </div>

                    <section className="checkout-hero">
                        <div>
                            <p className="checkout-eyebrow">Secure Checkout</p>
                            <h1>Review your gemstone purchase before confirming.</h1>
                            <p className="checkout-subtitle">
                                This order will be charged from your wallet balance only after you click confirm.
                            </p>
                        </div>
                        <button type="button" className="checkout-back-btn" onClick={() => navigate(`/gem/${gem?._id}`)}>
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to gem
                        </button>
                    </section>

                    {error ? <div className="checkout-alert error">{error}</div> : null}
                    {successMessage ? <div className="checkout-alert success">{successMessage}</div> : null}

                    <div className="checkout-grid">
                        <section className="checkout-card gem-card">
                            <div className="checkout-image-wrap">
                                <img src={gemImage} alt={gem?.title || 'Gemstone'} />
                            </div>
                            <div className="checkout-gem-body">
                                <div className="checkout-gem-top">
                                    <div>
                                        <p className="checkout-label">Selected gemstone</p>
                                        <h2>{gem?.title}</h2>
                                    </div>
                                    <span className={`checkout-status ${gem?.status === 'sold' ? 'sold' : 'available'}`}>
                                        {gem?.status || 'available'}
                                    </span>
                                </div>
                                <p className="checkout-seller">
                                    Sold by <strong>{gem?.sellerId?.name || 'Verified Seller'}</strong>
                                </p>
                                <div className="checkout-specs">
                                    <div>
                                        <span>Type</span>
                                        <strong>{gem?.type || 'Other'}</strong>
                                    </div>
                                    <div>
                                        <span>Carat</span>
                                        <strong>{gem?.attributes?.carat || 0} ct</strong>
                                    </div>
                                    <div>
                                        <span>Cut</span>
                                        <strong>{gem?.attributes?.cut || 'Unknown'}</strong>
                                    </div>
                                    <div>
                                        <span>Origin</span>
                                        <strong>{gem?.attributes?.origin || 'Sri Lanka'}</strong>
                                    </div>
                                </div>
                                <p className="checkout-description">{gem?.description}</p>
                            </div>
                        </section>

                        <aside className="checkout-card summary-card">
                            <p className="checkout-label">Payment summary</p>
                            <h2>Wallet payment</h2>

                            <div className="summary-row">
                                <span>Gem price</span>
                                <strong>{moneyFormatter.format(gemPrice)}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Wallet balance</span>
                                <strong>{moneyFormatter.format(availableBalance)}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Funds on hold</span>
                                <strong>{moneyFormatter.format(Number(wallet?.fundsOnHold) || 0)}</strong>
                            </div>
                            <div className="summary-row total">
                                <span>Balance after purchase</span>
                                <strong>{moneyFormatter.format(Math.max(balanceAfterPurchase, 0))}</strong>
                            </div>

                            <div className="checkout-address-card">
                                <p className="checkout-label">Shipping address</p>
                                <div className="checkout-address-grid">
                                    <label className="checkout-field">
                                        <span>Street Address</span>
                                        <input
                                            type="text"
                                            name="street"
                                            value={address.street}
                                            onChange={handleAddressChange}
                                            disabled={submitting || Boolean(successMessage)}
                                        />
                                    </label>
                                    <label className="checkout-field">
                                        <span>City</span>
                                        <input
                                            type="text"
                                            name="city"
                                            value={address.city}
                                            onChange={handleAddressChange}
                                            disabled={submitting || Boolean(successMessage)}
                                        />
                                    </label>
                                    <label className="checkout-field">
                                        <span>State / Province</span>
                                        <input
                                            type="text"
                                            name="state"
                                            value={address.state}
                                            onChange={handleAddressChange}
                                            disabled={submitting || Boolean(successMessage)}
                                        />
                                    </label>
                                    <label className="checkout-field">
                                        <span>Postal Code</span>
                                        <input
                                            type="text"
                                            name="postalCode"
                                            value={address.postalCode}
                                            onChange={handleAddressChange}
                                            disabled={submitting || Boolean(successMessage)}
                                        />
                                    </label>
                                    <label className="checkout-field checkout-field-full">
                                        <span>Country</span>
                                        <input
                                            type="text"
                                            name="country"
                                            value={address.country}
                                            onChange={handleAddressChange}
                                            disabled={submitting || Boolean(successMessage)}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="checkout-note">
                                <span className="material-symbols-outlined">verified_user</span>
                                <p>Your wallet will be charged only after you confirm this order.</p>
                            </div>

                            {gem?.status === 'sold' ? (
                                <div className="checkout-warning">
                                    This gemstone has already been sold and can no longer be purchased.
                                </div>
                            ) : null}

                            {gem?.sellingMethod !== 'instantPurchase' ? (
                                <div className="checkout-warning">
                                    This listing is not an instant-purchase gemstone.
                                </div>
                            ) : null}

                            {availableBalance < gemPrice ? (
                                <div className="checkout-warning">
                                    Insufficient wallet balance. Top up your wallet before confirming this order.
                                </div>
                            ) : null}

                            {!address.street.trim() || !address.city.trim() ? (
                                <div className="checkout-warning">
                                    Please complete the shipping address before confirming the purchase.
                                </div>
                            ) : null}

                            <div className="checkout-actions">
                                <button
                                    type="button"
                                    className="checkout-confirm-btn"
                                    onClick={handleConfirmPurchase}
                                    disabled={!canPurchase || submitting || Boolean(successMessage)}
                                >
                                    <span className="material-symbols-outlined">lock</span>
                                    {submitting ? 'Processing...' : 'Confirm Purchase'}
                                </button>
                                <button
                                    type="button"
                                    className="checkout-secondary-btn"
                                    onClick={() => navigate('/wallet')}
                                >
                                    Review Wallet
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GemCheckout;
