import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gemstoneAPI } from '../services/api';
import NavBar from './NavBar';
import './GemDetails.css';

const GemDetails = ({ user, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [gem, setGem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState('');

    useEffect(() => {
        const fetchGem = async () => {
            try {
                const response = await gemstoneAPI.getById(id);
                const g = response.data;
                setGem(g);
                
                if (g.images && g.images.length > 0) {
                    const primary = g.images.find(img => img.isPrimary) || g.images[0];
                    setMainImage(primary.url);
                }
                setLoading(false);
            } catch (err) {
                setError(err.message || 'Failed to load gemstone details');
                setLoading(false);
            }
        };
        fetchGem();
    }, [id]);

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/600x400?text=No+Image';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000/uploads/${url}`;
    };

    if (loading) {
        return (
            <div className="gem-details-loading">
                <div className="spinner"></div>
                <p>Loading premium gemstone data...</p>
            </div>
        );
    }

    if (error || !gem) {
        return (
            <div className="gem-details-error">
                <span className="material-symbols-outlined error-icon">error</span>
                <h2>Listing Unavailable</h2>
                <p>{error || "This gemstone does not exist or has been removed."}</p>
                <Link to="/home" className="back-btn">Return to Marketplace</Link>
            </div>
        );
    }

    return (
        <div className="gem-details-page">
            <NavBar user={user} onLogout={onLogout} />

            <main className="gem-details-container">
                <div className="gem-nav-breadcrumb">
                    <Link to="/home">Home</Link>
                    <span className="material-symbols-outlined">chevron_right</span>
                    <Link to={`/home?type=${gem.type}`}>{gem.type}</Link>
                    <span className="material-symbols-outlined">chevron_right</span>
                    <span className="active-breadcrumb">{gem.title}</span>
                </div>

                <div className="gem-details-grid">
                    {/* Left side: Images */}
                    <div className="gem-gallery">
                        <div className="gem-main-image">
                            <img src={getImageUrl(mainImage)} alt={gem.title} />
                        </div>
                        {gem.images && gem.images.length > 1 && (
                            <div className="gem-thumbnail-strip">
                                {gem.images.map((img, idx) => (
                                    <img 
                                        key={idx}
                                        src={getImageUrl(img.url)} 
                                        alt={`Thumbnail ${idx+1}`}
                                        className={`gem-thumbnail ${mainImage === img.url ? 'active' : ''}`}
                                        onClick={() => setMainImage(img.url)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right side: Information */}
                    <div className="gem-info-panel">
                        <div className="gem-title-area">
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                                {(gem.report || (gem.certifications && gem.certifications.length > 0)) && (
                                    <span className="gem-certified-badge">
                                        <span className="material-symbols-outlined">verified</span>
                                        Certified Authentic
                                    </span>
                                )}
                                <span className={`gem-certified-badge status-badge-${gem.status || 'available'}`} style={{ backgroundColor: gem.status === 'sold' ? '#64748b' : '#0ea5e9' }}>
                                    {(gem.status || 'available').toUpperCase()}
                                </span>
                            </div>
                            <h1 className="gem-title">{gem.title}</h1>
                            <p className="gem-seller">Offered by <strong>{gem.sellerId?.name || "Verified Seller"}</strong></p>
                        </div>

                        <div className="gem-price-area">
                            <span className="gem-price-label">Instant Purchase Price</span>
                            <h2 className="gem-price">${gem.price?.toLocaleString()}</h2>
                        </div>

                        <div className="gem-actions">
                            <button 
                                className="gem-buy-btn" 
                                disabled={gem.status === 'sold'} 
                                style={{ opacity: gem.status === 'sold' ? 0.5 : 1, cursor: gem.status === 'sold' ? 'not-allowed' : 'pointer' }}
                                onClick={() => navigate(`/checkout/gem/${gem._id}`)}
                            >
                                <span className="material-symbols-outlined">shopping_cart</span>
                                {gem.status === 'sold' ? 'Sold Out' : 'Buy Now'}
                            </button>
                            <button 
                                className="gem-offer-btn" 
                                onClick={() => navigate('/home')}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back to Home
                            </button>
                        </div>

                        <div className="gem-description-box">
                            <h3>Description</h3>
                            <p>{gem.description}</p>
                        </div>

                        <div className="gem-specs-box">
                            <h3>Specifications</h3>
                            <div className="gem-specs-grid">
                                <div className="spec-item">
                                    <span className="spec-label">Gem Type</span>
                                    <span className="spec-value">{gem.type}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Carat Weight</span>
                                    <span className="spec-value">{gem.attributes?.carat} ct</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Cut</span>
                                    <span className="spec-value">{gem.attributes?.cut || "Unknown"}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Color</span>
                                    <span className="spec-value">{gem.attributes?.color || "Origin"}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Clarity</span>
                                    <span className="spec-value">{gem.attributes?.clarity || "Unknown"}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Origin</span>
                                    <span className="spec-value">{gem.attributes?.origin || "Ceylon (Sri Lanka)"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Certificates */}
                        {(gem.report || (gem.certifications && gem.certifications.length > 0)) && (
                            <div className="gem-certificates-box">
                                <h3>Documentation</h3>
                                <div className="cert-list">
                                    {gem.report && (
                                        <a href={gem.report.startsWith('http') ? gem.report : `http://localhost:5000/uploads/${gem.report}`} target="_blank" rel="noreferrer" className="cert-link">
                                            <span className="material-symbols-outlined">file_present</span>
                                            Official Lab Report
                                        </a>
                                    )}
                                    {gem.certifications && gem.certifications.map((cert, idx) => (
                                        <a key={idx} href={cert.url?.startsWith('http') ? cert.url : `http://localhost:5000/uploads/${cert.url}`} target="_blank" rel="noreferrer" className="cert-link">
                                            <span className="material-symbols-outlined">workspace_premium</span>
                                            {cert.name || `Certificate ${idx + 1}`}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default GemDetails;
