import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function DisputeManagement() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('open');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [resolutionData, setResolutionData] = useState({
        action: 'refund',
        refundAmount: '',
        resolution: '',
        notes: ''
    });
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchDisputes();
        fetchStats();
    }, [activeTab]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/disputes?status=${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDisputes(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch disputes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/disputes/stats/summary', {
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

    const updatePriority = async (disputeId, priority) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/disputes/${disputeId}/priority`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ priority })
            });
            const data = await response.json();
            if (data.success) {
                fetchDisputes();
            }
        } catch (err) {
            alert('Failed to update priority');
        }
    };

    const addNote = async () => {
        if (!noteText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/disputes/${selectedDispute._id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ note: noteText })
            });
            const data = await response.json();
            if (data.success) {
                setShowNoteModal(false);
                setNoteText('');
                fetchDisputes();
            }
        } catch (err) {
            alert('Failed to add note');
        }
    };

    const resolveDispute = async () => {
        if (!resolutionData.resolution.trim()) {
            alert('Please provide a resolution summary');
            return;
        }

        setProcessingId(selectedDispute._id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/disputes/${selectedDispute._id}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: resolutionData.action,
                    refundAmount: resolutionData.action === 'partial' ? parseFloat(resolutionData.refundAmount) : undefined,
                    resolution: resolutionData.resolution,
                    notes: resolutionData.notes
                })
            });
            const data = await response.json();
            if (data.success) {
                setShowResolveModal(false);
                setResolutionData({ action: 'refund', refundAmount: '', resolution: '', notes: '' });
                fetchDisputes();
                fetchStats();
                alert('Dispute resolved successfully!');
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Failed to resolve dispute');
        } finally {
            setProcessingId(null);
        }
    };

    const getPriorityBadge = (priority) => {
        const config = {
            low: { class: 'priority-low', label: 'Low', icon: 'info' },
            medium: { class: 'priority-medium', label: 'Medium', icon: 'priority' },
            high: { class: 'priority-high', label: 'High', icon: 'warning' },
            urgent: { class: 'priority-urgent', label: 'Urgent', icon: 'emergency' }
        };
        const p = config[priority] || config.medium;
        return (
            <span className={`priority-badge ${p.class}`}>
        <span className="material-symbols-outlined">{p.icon}</span>
                {p.label}
      </span>
        );
    };

    const getStatusBadge = (status) => {
        const config = {
            open: { class: 'status-open', label: 'Open', icon: 'pending' },
            investigating: { class: 'status-investigating', label: 'Investigating', icon: 'search' },
            resolved: { class: 'status-resolved', label: 'Resolved', icon: 'check_circle' },
            closed: { class: 'status-closed', label: 'Closed', icon: 'lock' }
        };
        const s = config[status] || config.open;
        return (
            <span className={`status-badge ${s.class}`}>
        <span className="material-symbols-outlined">{s.icon}</span>
                {s.label}
      </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const tabs = [
        { id: 'open', label: 'Open', count: stats?.open || 0 },
        { id: 'investigating', label: 'Investigating', count: stats?.investigating || 0 },
        { id: 'resolved', label: 'Resolved', count: stats?.resolved || 0 },
        { id: 'closed', label: 'Closed', count: stats?.closed || 0 }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading disputes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dispute-management">
            {/* Header */}
            <div className="dispute-header">
                <div>
                    <h1 className="dispute-title">Dispute Management</h1>
                    <p className="dispute-subtitle">Resolve conflicts between buyers and sellers</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dispute-stats">
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">gavel</span>
                        <h4>Total Disputes</h4>
                    </div>
                    <p className="stat-value-small">{stats?.total || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">pending</span>
                        <h4>Open</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#f59e0b' }}>{stats?.open || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">search</span>
                        <h4>Investigating</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#3b82f6' }}>{stats?.investigating || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">warning</span>
                        <h4>High Priority</h4>
                    </div>
                    <p className="stat-value-small" style={{ color: '#ef4444' }}>{(stats?.highPriority || 0) + (stats?.urgentPriority || 0)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="dispute-tabs">
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
                    <button onClick={fetchDisputes} className="retry-btn">Try Again</button>
                </div>
            )}

            {/* Empty State */}
            {!error && disputes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">
                        <span className="material-symbols-outlined">gavel</span>
                    </div>
                    <h3>No {activeTab} disputes</h3>
                    <p>When buyers or sellers raise disputes, they'll appear here.</p>
                </div>
            )}

            {/* Disputes List */}
            {!error && disputes.length > 0 && (
                <div className="disputes-list">
                    {disputes.map(dispute => (
                        <div key={dispute._id} className="dispute-card">
                            <div className="dispute-card-header">
                                <div className="dispute-id">
                                    <span className="material-symbols-outlined">receipt</span>
                                    <span>#{dispute._id.slice(-8)}</span>
                                </div>
                                <div className="dispute-badges">
                                    {getPriorityBadge(dispute.priority)}
                                    {getStatusBadge(dispute.status)}
                                </div>
                            </div>

                            <div className="dispute-card-body">
                                <div className="dispute-parties">
                                    <div className="party">
                                        <span className="material-symbols-outlined">person</span>
                                        <div>
                                            <p className="party-label">Buyer</p>
                                            <p className="party-name">{dispute.buyerId?.name || 'Unknown'}</p>
                                            <p className="party-email">{dispute.buyerId?.email || ''}</p>
                                        </div>
                                    </div>
                                    <div className="party-vs">
                                        <span className="material-symbols-outlined">vs</span>
                                    </div>
                                    <div className="party">
                                        <span className="material-symbols-outlined">storefront</span>
                                        <div>
                                            <p className="party-label">Seller</p>
                                            <p className="party-name">{dispute.sellerId?.businessName || 'Unknown'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="dispute-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Amount:</span>
                                        <span className="detail-value amount">{formatCurrency(dispute.amount)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Reason:</span>
                                        <span className="detail-value">
                      {dispute.reason === 'itemNotReceived' ? 'Item Not Received' :
                          dispute.reason === 'itemNotAsDescribed' ? 'Item Not As Described' :
                              dispute.reason === 'damagedItem' ? 'Damaged Item' :
                                  dispute.reason === 'wrongItem' ? 'Wrong Item' : 'Other'}
                    </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Description:</span>
                                        <p className="detail-description">{dispute.description}</p>
                                    </div>
                                    {dispute.evidence && dispute.evidence.length > 0 && (
                                        <div className="detail-row">
                                            <span className="detail-label">Evidence:</span>
                                            <div className="evidence-links">
                                                {dispute.evidence.map((url, i) => (
                                                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="evidence-link">
                                                        📎 View Document {i + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes Section */}
                                {dispute.notes && dispute.notes.length > 0 && (
                                    <div className="notes-section">
                                        <p className="notes-title">
                                            <span className="material-symbols-outlined">chat</span>
                                            Admin Notes ({dispute.notes.length})
                                        </p>
                                        <div className="notes-list">
                                            {dispute.notes.slice(-3).map((note, idx) => (
                                                <div key={idx} className="note-item">
                                                    <p className="note-text">{note.text}</p>
                                                    <span className="note-date">{new Date(note.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="dispute-card-actions">
                                <button
                                    onClick={() => {
                                        setSelectedDispute(dispute);
                                        setShowNoteModal(true);
                                    }}
                                    className="btn-note"
                                >
                                    <span className="material-symbols-outlined">add_comment</span>
                                    Add Note
                                </button>
                                <select
                                    value={dispute.priority}
                                    onChange={(e) => updatePriority(dispute._id, e.target.value)}
                                    className="priority-select"
                                >
                                    <option value="low">Low Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                                    <button
                                        onClick={() => {
                                            setSelectedDispute(dispute);
                                            setShowResolveModal(true);
                                        }}
                                        className="btn-resolve"
                                    >
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Resolve
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Note Modal */}
            {showNoteModal && selectedDispute && (
                <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <span className="material-symbols-outlined">chat</span>
                            </div>
                            <h3>Add Note to Dispute</h3>
                        </div>
                        <div className="modal-body">
              <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add your note here..."
                  rows={4}
                  className="modal-textarea"
                  autoFocus
              />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowNoteModal(false)} className="btn-cancel">Cancel</button>
                            <button onClick={addNote} disabled={!noteText.trim()} className="btn-confirm">Add Note</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Dispute Modal */}
            {showResolveModal && selectedDispute && (
                <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <span className="material-symbols-outlined">gavel</span>
                            </div>
                            <h3>Resolve Dispute</h3>
                        </div>
                        <div className="modal-body">
                            <div className="dispute-summary">
                                <p><strong>Amount:</strong> {formatCurrency(selectedDispute.amount)}</p>
                                <p><strong>Reason:</strong> {selectedDispute.reason}</p>
                            </div>

                            <label className="modal-label">Resolution Action:</label>
                            <select
                                value={resolutionData.action}
                                onChange={(e) => setResolutionData({ ...resolutionData, action: e.target.value })}
                                className="modal-select"
                            >
                                <option value="refund">Full Refund to Buyer</option>
                                <option value="release">Release Funds to Seller</option>
                                <option value="partial">Partial Refund</option>
                            </select>

                            {resolutionData.action === 'partial' && (
                                <div>
                                    <label className="modal-label">Refund Amount:</label>
                                    <input
                                        type="number"
                                        value={resolutionData.refundAmount}
                                        onChange={(e) => setResolutionData({ ...resolutionData, refundAmount: e.target.value })}
                                        placeholder="Enter amount to refund"
                                        className="modal-input"
                                    />
                                </div>
                            )}

                            <label className="modal-label">Resolution Summary:</label>
                            <textarea
                                value={resolutionData.resolution}
                                onChange={(e) => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                                placeholder="Explain the resolution..."
                                rows={3}
                                className="modal-textarea"
                            />

                            <label className="modal-label">Internal Notes (Optional):</label>
                            <textarea
                                value={resolutionData.notes}
                                onChange={(e) => setResolutionData({ ...resolutionData, notes: e.target.value })}
                                placeholder="Add any internal notes..."
                                rows={2}
                                className="modal-textarea"
                            />
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowResolveModal(false)} className="btn-cancel">Cancel</button>
                            <button
                                onClick={resolveDispute}
                                disabled={processingId === selectedDispute._id || !resolutionData.resolution.trim()}
                                className="btn-confirm"
                            >
                                {processingId === selectedDispute._id ? 'Processing...' : 'Confirm Resolution'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DisputeManagement;