import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function GemstoneApprovals() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedListing, setSelectedListing] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [expandedListing, setExpandedListing] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    useEffect(() => {
        fetchListings();
        fetchStats();
    }, [activeTab, filterType, priceRange]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/gemstones?status=${activeTab}`;
            if (filterType !== 'all') url += `&type=${filterType}`;
            if (priceRange.min) url += `&minPrice=${priceRange.min}`;
            if (priceRange.max) url += `&maxPrice=${priceRange.max}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setListings(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch gemstone listings');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/gemstones/stats/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleApprove = async (listingId) => {
        if (!window.confirm('Approve this gemstone listing? It will become visible to buyers.')) return;

        setProcessingId(listingId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/gemstones/${listingId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                fetchListings();
                fetchStats();
                alert('Gemstone listing approved successfully!');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to approve listing');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (listing) => {
        setSelectedListing(listing);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessingId(selectedListing._id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/gemstones/${selectedListing._id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: rejectReason })
            });

            const data = await response.json();
            if (data.success) {
                setShowRejectModal(false);
                fetchListings();
                fetchStats();
                alert('Gemstone listing rejected');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to reject listing');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'pending') {
            return (
                <span className="status-badge status-pending">
          <span className="material-symbols-outlined">schedule</span>
          Pending Review
        </span>
            );
        } else if (status === 'approved') {
            return (
                <span className="status-badge status-approved">
          <span className="material-symbols-outlined">check_circle</span>
          Approved
        </span>
            );
        } else {
            return (
                <span className="status-badge status-rejected">
          <span className="material-symbols-outlined">cancel</span>
          Rejected
        </span>
            );
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getGemTypeIcon = (type) => {
        const icons = {
            'Blue Sapphire': '💙',
            'Padparadscha': '🧡',
            'Ruby': '❤️',
            'Yellow Sapphire': '💛',
            'Emerald': '💚',
            'Other': '💎'
        };
        return icons[type] || '💎';
    };

    const tabs = [
        { id: 'pending', label: 'Pending Review', count: stats?.pending || 0 },
        { id: 'approved', label: 'Approved', count: stats?.approved || 0 },
        { id: 'rejected', label: 'Rejected', count: stats?.rejected || 0 }
    ];

    const gemTypes = [
        'all', 'Blue Sapphire', 'Padparadscha', 'Ruby', 'Yellow Sapphire', 'Emerald', 'Other'
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading gemstone listings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="gemstone-approvals">
            {/* Header */}
            <div className="gemstone-header">
                <div>
                    <h1 className="gemstone-title">Gemstone Listing Approvals</h1>
                    <p className="gemstone-subtitle">Review and approve gemstone listings before they go live on the marketplace</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="gemstone-stats">
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">inventory_2</span>
                        <h4>Total Listings</h4>
                    </div>
                    <p className="stat-value-small">{stats?.totalListings || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">schedule</span>
                        <h4>Pending</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#f59e0b' }}>{stats?.pending || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">check_circle</span>
                        <h4>Approved</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#10b981' }}>{stats?.approved || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">cancel</span>
                        <h4>Rejected</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#ef4444' }}>{stats?.rejected || 0}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="gemstone-filters">
                <div className="filter-group">
                    <label className="filter-label">Gem Type:</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                        {gemTypes.map(type => (
                            <option key={type} value={type}>{type === 'all' ? 'All Types' : type}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Price Range:</label>
                    <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="filter-input"
                    />
                    <span className="filter-separator">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="filter-input"
                    />
                </div>
                <button onClick={fetchListings} className="filter-refresh">
                    <span className="material-symbols-outlined">refresh</span>
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="gemstone-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.count > 0 && <span className="tab-badge">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {error && (
                <div className="error-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button onClick={fetchListings} className="retry-btn">Try Again</button>
                </div>
            )}

            {/* Empty State */}
            {!error && listings.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <span className="material-symbols-outlined">diamond</span>
                    </div>
                    <h3>No {activeTab} listings</h3>
                    <p>
                        {activeTab === 'pending'
                            ? "When sellers submit gemstone listings, they'll appear here for review."
                            : `No ${activeTab} gemstone listings found.`}
                    </p>
                </div>
            )}

            {/* Listings Grid */}
            {!error && listings.length > 0 && (
                <div className="gemstone-grid">
                    {listings.map((item) => {
                        const gemstone = item.gemstone || item;
                        const isExpanded = expandedListing === gemstone._id;
                        const approvalStatus = item.approvalStatus || gemstone.approvalStatus || 'pending';
                        const rejectionReason = item.rejectionReason || gemstone.rejectionReason;

                        return (
                            <div key={gemstone._id} className="gemstone-card">
                                {/* Card Header */}
                                <div className="gemstone-card-header">
                                    <div className="gemstone-type-icon">
                                        <span className="gemstone-emoji">{getGemTypeIcon(gemstone.type)}</span>
                                        <div>
                                            <h3 className="gemstone-title-card">{gemstone.title}</h3>
                                            <p className="gemstone-type">{gemstone.type}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(approvalStatus)}
                                </div>

                                {/* Images Preview */}
                                {gemstone.images && gemstone.images.length > 0 && (
                                    <div className="gemstone-images">
                                        <div className="image-preview">
                                            <img
                                                src={gemstone.images[0]?.url ? `http://localhost:5000/uploads/${gemstone.images[0].url}` : 'https://via.placeholder.com/100'}
                                                alt={gemstone.title}
                                                className="preview-img"
                                            />
                                            {gemstone.images.length > 1 && (
                                                <span className="image-count">+{gemstone.images.length - 1}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Card Body */}
                                <div className="gemstone-card-body">
                                    <div className="gemstone-price">
                                        <span className="price-label">Price</span>
                                        <span className="price-value">{formatCurrency(gemstone.price)}</span>
                                    </div>

                                    <div className="gemstone-attributes">
                                        <div className="attribute">
                                            <span className="attribute-label">Carat</span>
                                            <span className="attribute-value">{gemstone.attributes?.carat || 'N/A'} ct</span>
                                        </div>
                                        <div className="attribute">
                                            <span className="attribute-label">Cut</span>
                                            <span className="attribute-value">{gemstone.attributes?.cut || 'N/A'}</span>
                                        </div>
                                        <div className="attribute">
                                            <span className="attribute-label">Origin</span>
                                            <span className="attribute-value">{gemstone.attributes?.origin || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="seller-info">
                                        <span className="material-symbols-outlined">storefront</span>
                                        <span>{gemstone.sellerId?.name || 'Unknown Seller'}</span>
                                    </div>

                                    {/* Description (expandable) */}
                                    {gemstone.description && (
                                        <div className="description-section">
                                            <button
                                                className="description-toggle"
                                                onClick={() => setExpandedListing(isExpanded ? null : gemstone._id)}
                                            >
                                                <span className="material-symbols-outlined">description</span>
                                                Description
                                                <span className="material-symbols-outlined">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                                            </button>
                                            {isExpanded && (
                                                <p className="description-text">{gemstone.description}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Certifications */}
                                    {gemstone.certifications && gemstone.certifications.length > 0 && (
                                        <div className="certifications-section">
                                            <p className="cert-title">
                                                <span className="material-symbols-outlined">verified</span>
                                                Certifications
                                            </p>
                                            <div className="cert-list">
                                                {gemstone.certifications.map((cert, idx) => (
                                                    <div key={idx} className="cert-item">
                                                        <span>{cert.name}</span>
                                                        <span className="cert-number">{cert.number}</span>
                                                        {cert.url && (
                                                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="cert-link">
                                                                View
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {approvalStatus === 'rejected' && rejectionReason && (
                                        <div className="rejection-reason">
                                            <span className="material-symbols-outlined">warning</span>
                                            <div>
                                                <div className="rejection-label">Rejection Reason</div>
                                                <div className="rejection-text">{rejectionReason}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {approvalStatus === 'pending' && (
                                    <div className="gemstone-card-actions">
                                        <button
                                            onClick={() => handleApprove(gemstone._id)}
                                            disabled={processingId === gemstone._id}
                                            className="btn-approve-gemstone"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            {processingId === gemstone._id ? 'Processing...' : 'Approve Listing'}
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(gemstone)}
                                            disabled={processingId === gemstone._id}
                                            className="btn-reject-gemstone"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedListing && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <h3>Reject Gemstone Listing</h3>
                        </div>
                        <div className="modal-body">
                            <p className="modal-warning">
                                You are about to reject <strong>{selectedListing.title}</strong>
                            </p>
                            <label className="modal-label">
                                Reason for rejection:
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Please provide a clear reason for rejection..."
                                rows={4}
                                className="modal-textarea"
                                autoFocus
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowRejectModal(false)} className="btn-cancel">
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="btn-confirm"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GemstoneApprovals;
