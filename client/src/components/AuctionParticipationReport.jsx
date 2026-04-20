import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuctionReports.css';

const AuctionParticipationReport = ({ user }) => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    // Fetch auction participation data
    useEffect(() => {
        const fetchAuctionParticipation = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/auctions/my-participation', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.success) {
                    setAuctions(data.data || []);
                    console.log('✅ Auctions loaded:', (data.data || []).length);
                } else {
                    // Show empty state instead of error if no auctions
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

        fetchAuctionParticipation();
    }, []);

    const filteredAuctions = filterStatus === 'all'
        ? auctions
        : auctions.filter(auction => {
            if (filterStatus === 'won') return auction.winnerId === user.id;
            if (filterStatus === 'lost') return auction.winnerId !== user.id && auction.bidsCount > 0;
            if (filterStatus === 'active') return auction.status === 'active';
            if (filterStatus === 'ended') return auction.status === 'ended';
            return true;
        });

    const downloadCSV = () => {
        const headers = ['Gem Name', 'Auction Status', 'Your Bids', 'Final Price', 'Winner', 'Start Date', 'End Date', 'Result'];

        const rows = filteredAuctions.map(auction => [
            auction.gemName || 'N/A',
            auction.status,
            auction.bidsCount || 0,
            moneyFormatter.format(auction.currentPrice || 0),
            auction.winnerName || 'No Winner',
            dateFormatter.format(new Date(auction.startTime)),
            dateFormatter.format(new Date(auction.endTime)),
            auction.winnerId === user.id ? 'WON' : 'LOST'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `auction-participation-${new Date().toISOString().split('T')[0]}.csv`;
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
            if (tab.id === 'auctions') {
                // Already on this page
                return;
            } else if (tab.id === 'bids') {
                navigate('/seller-bids-report');
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
                        <span className="pp-role-pill">{profile?.role || 'buyer'}</span>
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
                                className={`pp-nav-item ${tab.id === 'auctions' ? 'pp-nav-active' : ''}`}
                                onClick={() => handleNavClick(tab)}
                            >
                                <span className="pp-nav-icon">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.id === 'auctions' && <span className="pp-nav-dot" />}
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
                                    <h3 className="pp-section-title">Auction Participation Report</h3>
                                    <p className="pp-section-sub">Track all auctions you've bid on</p>
                                </div>
                                <button
                                    className="pp-btn-primary"
                                    onClick={downloadCSV}
                                    disabled={filteredAuctions.length === 0}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    Download CSV
                                </button>
                            </div>

                            <div className="ar-filters" style={{ marginBottom: '1.5rem' }}>
                                {['all', 'active', 'ended', 'won', 'lost'].map(status => (
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
                                    <p>You haven't participated in any auctions yet.</p>
                                </div>
                            ) : filteredAuctions.length === 0 ? (
                                <div className="ar-empty">
                                    <span className="material-symbols-outlined">filter_list</span>
                                    <h3>No Results</h3>
                                    <p>No auctions match your current filter.</p>
                                </div>
                            ) : (
                                <div className="ar-table-wrapper">
                                    <table className="ar-table">
                                        <thead>
                                        <tr>
                                            <th>Gem Name</th>
                                            <th>Status</th>
                                            <th>Your Bids</th>
                                            <th>Final Price</th>
                                            <th>Winner</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Result</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {filteredAuctions.map(auction => (
                                            <tr key={auction._id} className={auction.winnerId === user.id ? 'ar-won' : ''}>
                                                <td className="ar-gem-name">{auction.gemName}</td>
                                                <td>
                                                        <span className={`ar-status ar-status-${auction.status}`}>
                                                            {auction.status}
                                                        </span>
                                                </td>
                                                <td className="ar-center">{auction.bidsCount || 0}</td>
                                                <td className="ar-price">{moneyFormatter.format(auction.currentPrice || 0)}</td>
                                                <td>{auction.winnerName || 'No Winner'}</td>
                                                <td className="ar-date">{dateFormatter.format(new Date(auction.startTime))}</td>
                                                <td className="ar-date">{dateFormatter.format(new Date(auction.endTime))}</td>
                                                <td>
                                                        <span className={`ar-result ${auction.winnerId === user.id ? 'won' : 'lost'}`}>
                                                            {auction.winnerId === user.id ? '🏆 WON' : '✕ LOST'}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
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

export default AuctionParticipationReport;