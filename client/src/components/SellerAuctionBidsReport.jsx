import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuctionReports.css';

const SellerAuctionBidsReport = ({ user }) => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedAuction, setExpandedAuction] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const moneyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setProfile(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            }
        };
        fetchProfile();
    }, []);

    // Fetch seller auctions data
    useEffect(() => {
        const fetchSellerAuctions = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/auctions/seller/my-auctions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.success) {
                    setAuctions(data.data || []);
                    console.log('✅ Seller auctions loaded:', (data.data || []).length);
                } else {
                    // Show empty state instead of error
                    setAuctions([]);
                    console.log('ℹ️ No auctions found');
                }
            } catch (err) {
                console.error('Error:', err);
                // Treat fetch errors as empty state too
                setAuctions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerAuctions();
    }, []);

    const filteredAuctions = filterStatus === 'all'
        ? auctions
        : auctions.filter(auction => auction.status === filterStatus);

    const downloadDetailedCSV = () => {
        const headers = ['Auction ID', 'Gem Name', 'Status', 'Total Bids', 'Highest Bid', 'Winner', 'Start Price', 'Reserve Price', 'Start Time', 'End Time'];

        const rows = filteredAuctions.map(auction => [
            auction._id,
            auction.gemName || 'N/A',
            auction.status,
            auction.totalBids || 0,
            moneyFormatter.format(auction.currentPrice || 0),
            auction.winnerName || 'No Winner',
            moneyFormatter.format(auction.startPrice || 0),
            moneyFormatter.format(auction.reservePrice || 0),
            dateFormatter.format(new Date(auction.startTime)),
            dateFormatter.format(new Date(auction.endTime))
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `seller-auctions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadBidsCSV = (auction) => {
        const headers = ['Bidder Name', 'Bid Amount', 'Bid Time', 'Status'];

        const rows = (auction.bids || []).map(bid => [
            bid.bidderName || 'Unknown',
            moneyFormatter.format(bid.amount || 0),
            dateFormatter.format(new Date(bid.bidTime)),
            bid.isWinning ? 'WINNING' : 'OUTBID'
        ]);

        const csvContent = [
            `Auction: ${auction.gemName}`,
            `Total Bids: ${auction.totalBids}`,
            `Final Price: ${moneyFormatter.format(auction.currentPrice)}`,
            '',
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bids-${auction._id}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Build tabs array like ProfilePage
    const tabs = [
        { id: 'personal', label: 'Personal', icon: '👤' },
        { id: 'address', label: 'Address', icon: '📍' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'auctions', label: 'My Auctions', icon: '🏆', action: 'navigate' },
        ...(profile?.role === 'seller' || profile?.becomeSeller
            ? [
                { id: 'business', label: 'Business', icon: '🏪' },
                { id: 'bids', label: 'Bids Report', icon: '📊', action: 'navigate' }
            ]
            : [])
    ];

    const handleNavClick = (tab) => {
        if (tab.action === 'navigate') {
            if (tab.id === 'bids') {
                // Already on this page
                return;
            } else if (tab.id === 'auctions') {
                navigate('/auction-participation-report');
            }
        } else {
            navigate('/profile');
        }
    };

    return (
        <div className="pp-root">
            <div className="pp-layout">
                {/* Sidebar */}
                <aside className="pp-sidebar">
                    <button className="pp-back" onClick={() => navigate('/profile')}>
                        <span className="pp-back-arrow">←</span>
                        Back
                    </button>

                    <div className="pp-identity">
                        <div className="pp-avatar-ring">
                            <div className="pp-avatar">
                                {getInitials(profile?.name || user?.name)}
                            </div>
                        </div>
                        <h2 className="pp-name">{profile?.name || user?.name || 'My Profile'}</h2>
                        <span className="pp-role-pill">{profile?.role || 'seller'}</span>
                        {profile?.createdAt && (
                            <p className="pp-since">
                                Member since {new Date(profile.createdAt).getFullYear()}
                            </p>
                        )}
                    </div>

                    {/* ✅ Show all navigation tabs */}
                    <nav className="pp-nav">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`pp-nav-item ${tab.id === 'bids' ? 'pp-nav-active' : ''}`}
                                onClick={() => handleNavClick(tab)}
                            >
                                <span className="pp-nav-icon">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.id === 'bids' && <span className="pp-nav-dot" />}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="pp-main">
                    {loading ? (
                        <div className="pp-loading">
                            <div className="pp-spinner" />
                            <span>Loading auction data…</span>
                        </div>
                    ) : (
                        <>
                            <div className="pp-section-head" style={{ marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 className="pp-section-title">Seller Auction Bids Report</h3>
                                    <p className="pp-section-sub">Track all bids on your auctions</p>
                                </div>
                                <button
                                    className="pp-btn-primary"
                                    onClick={downloadDetailedCSV}
                                    disabled={filteredAuctions.length === 0}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    Download All CSV
                                </button>
                            </div>

                            <div className="ar-filters" style={{ marginBottom: '1.5rem' }}>
                                {['all', 'scheduled', 'active', 'ended', 'cancelled'].map(status => (
                                    <button
                                        key={status}
                                        className={`ar-filter-btn ${filterStatus === status ? 'active' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {auctions.length === 0 ? (
                                <div className="ar-empty">
                                    <span className="material-symbols-outlined">event_busy</span>
                                    <h3>No Auctions Found</h3>
                                    <p>You haven't created any auctions yet.</p>
                                </div>
                            ) : filteredAuctions.length === 0 ? (
                                <div className="ar-empty">
                                    <span className="material-symbols-outlined">filter_list</span>
                                    <h3>No Results</h3>
                                    <p>No auctions match your current filter.</p>
                                </div>
                            ) : (
                                <div className="ar-cards">
                                    {filteredAuctions.map(auction => (
                                        <div key={auction._id} className="ar-card">
                                            <div className="ar-card-header">
                                                <div className="ar-card-title">
                                                    <h3>{auction.gemName}</h3>
                                                    <span className={`ar-status ar-status-${auction.status}`}>
                                                        {auction.status}
                                                    </span>
                                                </div>
                                                <button
                                                    className="ar-expand-btn"
                                                    onClick={() => setExpandedAuction(expandedAuction === auction._id ? null : auction._id)}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        {expandedAuction === auction._id ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="ar-card-stats">
                                                <div className="ar-stat">
                                                    <span className="ar-stat-label">Total Bids</span>
                                                    <span className="ar-stat-value">{auction.totalBids || 0}</span>
                                                </div>
                                                <div className="ar-stat">
                                                    <span className="ar-stat-label">Highest Bid</span>
                                                    <span className="ar-stat-value">{moneyFormatter.format(auction.currentPrice || 0)}</span>
                                                </div>
                                                <div className="ar-stat">
                                                    <span className="ar-stat-label">Start Price</span>
                                                    <span className="ar-stat-value">{moneyFormatter.format(auction.startPrice || 0)}</span>
                                                </div>
                                                <div className="ar-stat">
                                                    <span className="ar-stat-label">Reserve Price</span>
                                                    <span className="ar-stat-value">{moneyFormatter.format(auction.reservePrice || 0)}</span>
                                                </div>
                                            </div>

                                            <div className="ar-card-dates">
                                                <p><strong>Start:</strong> {dateFormatter.format(new Date(auction.startTime))}</p>
                                                <p><strong>End:</strong> {dateFormatter.format(new Date(auction.endTime))}</p>
                                                <p><strong>Winner:</strong> {auction.winnerName || 'No Winner'}</p>
                                            </div>

                                            {expandedAuction === auction._id && (
                                                <div className="ar-card-expanded">
                                                    <h4>Bids Details</h4>
                                                    {(auction.bids && auction.bids.length > 0) ? (
                                                        <div className="ar-bids-list">
                                                            {auction.bids.map((bid, idx) => (
                                                                <div key={idx} className={`ar-bid-item ${bid.isWinning ? 'winning' : ''}`}>
                                                                    <div className="ar-bid-info">
                                                                        <span className="ar-bidder">{bid.bidderName || 'Unknown'}</span>
                                                                        <span className="ar-bid-time">{dateFormatter.format(new Date(bid.bidTime))}</span>
                                                                    </div>
                                                                    <div className="ar-bid-amount">
                                                                        {moneyFormatter.format(bid.amount || 0)}
                                                                    </div>
                                                                    <span className={`ar-bid-status ${bid.isWinning ? 'winning' : 'outbid'}`}>
                                                                        {bid.isWinning ? '🏆' : '✕'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="ar-no-bids">No bids placed on this auction</p>
                                                    )}
                                                    <button
                                                        className="ar-download-bids-btn"
                                                        onClick={() => downloadBidsCSV(auction)}
                                                    >
                                                        <span className="material-symbols-outlined">download</span>
                                                        Download Bids CSV
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="ar-footer" style={{ marginTop: '2rem' }}>
                                <p>Total Auctions: <strong>{filteredAuctions.length}</strong></p>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SellerAuctionBidsReport;