import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function SellerApprovals() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [processingId, setProcessingId] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [expandedSeller, setExpandedSeller] = useState(null);

    useEffect(() => {
        fetchSellers();
        fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/sellers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const pending = data.data.filter(s => s.verificationStatus === 'pending').length;
                const approved = data.data.filter(s => s.verificationStatus === 'approved').length;
                const rejected = data.data.filter(s => s.verificationStatus === 'rejected').length;
                setStats({ pending, approved, rejected });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchSellers = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/sellers?status=${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                setSellers(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch sellers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (sellerId) => {
        if (!window.confirm('Approve this seller? They will get full seller privileges.')) return;

        setProcessingId(sellerId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/sellers/${sellerId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                fetchSellers();
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error approving seller');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (seller) => {
        setSelectedSeller(seller);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessingId(selectedSeller._id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/sellers/${selectedSeller._id}/reject`, {
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
                fetchSellers();
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error rejecting seller');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'pending': return 'Pending Review';
            case 'approved': return 'Verified';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading verification requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Hero Section */}
            <div className="admin-hero">
                <div className="admin-hero-content">
                    <div className="admin-hero-icon">
                        <span className="material-symbols-outlined">verified</span>
                    </div>
                    <h1>Seller Verification</h1>
                    <p>Review and verify gemstone dealers to maintain marketplace integrity and build trust with buyers.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-header">
                        <span className="stat-title">Total Sellers</span>
                        <div className="stat-icon">
                            <span className="material-symbols-outlined">storefront</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.pending + stats.approved + stats.rejected}</div>
                </div>

                <div className="stat-card amber">
                    <div className="stat-header">
                        <span className="stat-title">Pending Review</span>
                        <div className="stat-icon">
                            <span className="material-symbols-outlined">hourglass_empty</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.pending}</div>
                </div>

                <div className="stat-card emerald">
                    <div className="stat-header">
                        <span className="stat-title">Verified Sellers</span>
                        <div className="stat-icon">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.approved}</div>
                </div>

                <div className="stat-card rose">
                    <div className="stat-header">
                        <span className="stat-title">Rejected</span>
                        <div className="stat-icon">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>
                    </div>
                    <div className="stat-value">{stats.rejected}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        <span className="material-symbols-outlined">schedule</span>
                        Pending
                        {stats.pending > 0 && <span className="tab-badge">{stats.pending}</span>}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                    >
                        <span className="material-symbols-outlined">verified</span>
                        Verified
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rejected')}
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        Rejected
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <span className="material-symbols-outlined">apps</span>
                        All
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button onClick={fetchSellers} className="retry-btn">Try Again</button>
                </div>
            )}

            {/* Empty State */}
            {!error && sellers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <span className="material-symbols-outlined">inbox</span>
                    </div>
                    <h3>No {activeTab} applications</h3>
                    <p>
                        {activeTab === 'pending'
                            ? "When sellers submit verification requests, they'll appear here for review."
                            : `No sellers with ${activeTab} status found.`}
                    </p>
                </div>
            )}

            {/* Seller Cards Grid */}
            {!error && sellers.length > 0 && (
                <div className="cards-grid">
                    {sellers.map((seller) => {
                        const isExpanded = expandedSeller === seller._id;

                        return (
                            <div key={seller._id} className="seller-card">
                                <div className="card-header">
                                    <div className="seller-info">
                                        <div className="seller-avatar">
                                            <span className="material-symbols-outlined">business</span>
                                        </div>
                                        <div className="seller-details">
                                            <h3>{seller.businessName || 'Business Name Not Provided'}</h3>
                                            <p>Reg: {seller.businessRegistration || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className={`status-badge ${getStatusClass(seller.verificationStatus)}`}>
                    <span className="material-symbols-outlined">
                      {seller.verificationStatus === 'pending' ? 'schedule' :
                          seller.verificationStatus === 'approved' ? 'check_circle' : 'cancel'}
                    </span>
                                        {getStatusText(seller.verificationStatus)}
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="info-row">
                                        <div className="info-icon">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                        <div>
                                            <div className="info-label">Applicant</div>
                                            <div className="info-value">{seller.userId?.name || 'Unknown'}</div>
                                        </div>
                                    </div>

                                    <div className="info-row">
                                        <div className="info-icon">
                                            <span className="material-symbols-outlined">mail</span>
                                        </div>
                                        <div>
                                            <div className="info-label">Email</div>
                                            <div className="info-value">{seller.userId?.email || 'Not provided'}</div>
                                        </div>
                                    </div>

                                    <div className="info-row">
                                        <div className="info-icon">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                        </div>
                                        <div>
                                            <div className="info-label">Submitted</div>
                                            <div className="info-value">
                                                {new Date(seller.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Documents Section */}
                                    {seller.verificationDocuments && seller.verificationDocuments.length > 0 && (
                                        <div className="documents-section">
                                            <button
                                                className="documents-toggle"
                                                onClick={() => setExpandedSeller(isExpanded ? null : seller._id)}
                                            >
                                                <span>📄 Verification Documents ({seller.verificationDocuments.length})</span>
                                                <span className="material-symbols-outlined">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                                            </button>

                                            {isExpanded && (
                                                <div className="documents-list">
                                                    {seller.verificationDocuments.map((doc, idx) => (
                                                        <div key={idx} className="document-item">
                                                            <div className="document-info">
                                                                <div className="document-icon">
                                                                    <span className="material-symbols-outlined">description</span>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                                                                        {doc.type === 'businessRegistration' ? 'Business Registration' :
                                                                            doc.type === 'nationalID' ? 'National ID' : 'Other Document'}
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                                                                <span className="material-symbols-outlined">visibility</span>
                                                                View
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {seller.verificationStatus === 'rejected' && seller.rejectionReason && (
                                        <div className="rejection-reason">
                                            <span className="material-symbols-outlined">warning</span>
                                            <div>
                                                <div className="rejection-label">Rejection Reason</div>
                                                <div style={{ fontSize: '14px', color: '#f43f5e' }}>{seller.rejectionReason}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {seller.verificationStatus === 'pending' && (
                                    <div className="card-actions">
                                        <button
                                            onClick={() => handleApprove(seller._id)}
                                            disabled={processingId === seller._id}
                                            className="btn-approve"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            {processingId === seller._id ? 'Processing...' : 'Approve Seller'}
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(seller)}
                                            disabled={processingId === seller._id}
                                            className="btn-reject"
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
            {showRejectModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <span className="material-symbols-outlined" style={{ color: '#f43f5e' }}>warning</span>
                            </div>
                            <h3>Reject Seller Application</h3>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '20px', color: '#475569' }}>
                                You are about to reject <strong>{selectedSeller.businessName || 'this seller'}</strong>
                            </p>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>
                                Reason for rejection
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
                            <button onClick={handleReject} disabled={!rejectReason.trim()} className="btn-confirm">
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SellerApprovals;
