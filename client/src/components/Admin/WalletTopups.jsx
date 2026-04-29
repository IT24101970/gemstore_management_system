import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function WalletTopups() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    useEffect(() => {
        fetchRequests();
        fetchStats();
    }, [activeTab, pagination.page]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/topups?status=${activeTab}&page=${pagination.page}&limit=${pagination.limit}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    pages: data.pagination.pages
                }));
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch top-up requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/topups/stats/summary', {
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

    const handleApprove = async (requestId) => {
        if (!window.confirm('Approve this top-up request? Funds will be added to the user\'s wallet.')) return;

        setProcessingId(requestId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/topups/${requestId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                fetchRequests();
                fetchStats();
                alert('Top-up approved successfully!');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to approve top-up');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (request) => {
        setSelectedRequest(request);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessingId(selectedRequest._id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/topups/${selectedRequest._id}/reject`, {
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
                fetchRequests();
                fetchStats();
                alert('Top-up request rejected');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to reject request');
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { class: 'status-pending', label: 'Pending', icon: 'schedule' },
            approved: { class: 'status-approved', label: 'Approved', icon: 'check_circle' },
            rejected: { class: 'status-rejected', label: 'Rejected', icon: 'cancel' }
        };
        const s = config[status] || config.pending;
        return (
            <span className={`status-badge ${s.class}`}>
        <span className="material-symbols-outlined">{s.icon}</span>
                {s.label}
      </span>
        );
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            bankTransfer: '🏦 Bank Transfer',
            creditCard: '💳 Credit Card',
            debitCard: '💳 Debit Card',
            mobilePayment: '📱 Mobile Payment'
        };
        return methods[method] || method;
    };

    const tabs = [
        { id: 'pending', label: 'Pending', count: stats?.totalPending || 0 },
        { id: 'approved', label: 'Approved', count: stats?.totalApproved || 0 },
        { id: 'rejected', label: 'Rejected', count: stats?.totalRejected || 0 }
    ];

    if (loading && requests.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading top-up requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wallet-topups">
            {/* Header */}
            <div className="topup-header">
                <div>
                    <h1 className="topup-title">Wallet Top-up Approvals</h1>
                    <p className="topup-subtitle">Review and approve user wallet funding requests</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="topup-stats">
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">pending</span>
                        <h4>Pending Requests</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#f59e0b' }}>{stats?.totalPending || 0}</p>
                    <p className="stat-trend">{formatCurrency(stats?.pendingAmount || 0)} total</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">check_circle</span>
                        <h4>Approved</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#10b981' }}>{stats?.totalApproved || 0}</p>
                    <p className="stat-trend">{formatCurrency(stats?.approvedAmount || 0)} total</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">cancel</span>
                        <h4>Rejected</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#ef4444' }}>{stats?.totalRejected || 0}</p>
                    <p className="stat-trend">{formatCurrency(stats?.rejectedAmount || 0)} total</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="topup-tabs">
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
                    <button onClick={fetchRequests} className="retry-btn">Try Again</button>
                </div>
            )}

            {/* Empty State */}
            {!error && requests.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <h3>No {activeTab} top-up requests</h3>
                    <p>When users request wallet top-ups, they'll appear here.</p>
                </div>
            )}

            {/* Requests List */}
            {!error && requests.length > 0 && (
                <div className="topup-list">
                    {requests.map((request) => (
                        <div key={request._id} className="topup-card">
                            <div className="topup-card-header">
                                <div className="user-info-card">
                                    <span className="material-symbols-outlined user-avatar">person</span>
                                    <div>
                                        <p className="user-name">{request.userId?.name || 'Unknown User'}</p>
                                        <p className="user-email">{request.userId?.email || 'No email'}</p>
                                    </div>
                                </div>
                                <div className="amount-badge">
                                    <span className="amount-value">{formatCurrency(request.amount)}</span>
                                </div>
                            </div>

                            <div className="topup-card-body">
                                <div className="detail-row">
                                    <span className="detail-label">Payment Method:</span>
                                    <span className="detail-value">{getPaymentMethodLabel(request.paymentMethod)}</span>
                                </div>
                                {request.bankReference && (
                                    <div className="detail-row">
                                        <span className="detail-label">Reference:</span>
                                        <span className="detail-value">{request.bankReference}</span>
                                    </div>
                                )}
                                {request.receiptImage && (
                                    <div className="detail-row">
                                        <span className="detail-label">Receipt:</span>
                                        <a href={request.receiptImage} target="_blank" rel="noopener noreferrer" className="receipt-link">
                                            View Receipt
                                        </a>
                                    </div>
                                )}
                                <div className="detail-row">
                                    <span className="detail-label">Requested:</span>
                                    <span className="detail-value">{new Date(request.createdAt).toLocaleString()}</span>
                                </div>
                                {request.status === 'rejected' && request.rejectionReason && (
                                    <div className="rejection-reason">
                                        <span className="material-symbols-outlined">warning</span>
                                        <div>
                                            <div className="rejection-label">Rejection Reason</div>
                                            <div className="rejection-text">{request.rejectionReason}</div>
                                        </div>
                                    </div>
                                )}
                                {request.status === 'approved' && request.approvedAt && (
                                    <div className="approval-info">
                                        <span className="material-symbols-outlined">verified</span>
                                        <div>
                                            <div className="approval-label">Approved by {request.approvedBy?.name || 'Admin'}</div>
                                            <div className="approval-date">{new Date(request.approvedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {request.status === 'pending' && (
                                <div className="topup-card-actions">
                                    <button
                                        onClick={() => handleApprove(request._id)}
                                        disabled={processingId === request._id}
                                        className="btn-approve-topup"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        {processingId === request._id ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(request)}
                                        disabled={processingId === request._id}
                                        className="btn-reject-topup"
                                    >
                                        <span className="material-symbols-outlined">cancel</span>
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="page-btn"
                    >
                        Previous
                    </button>
                    <span className="page-info">Page {pagination.page} of {pagination.pages}</span>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="page-btn"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <h3>Reject Top-up Request</h3>
                        </div>
                        <div className="modal-body">
                            <p className="modal-warning">
                                You are about to reject a top-up request of <strong>{formatCurrency(selectedRequest.amount)}</strong> from <strong>{selectedRequest.userId?.name}</strong>
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

export default WalletTopups;7
