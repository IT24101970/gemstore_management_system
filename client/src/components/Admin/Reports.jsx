import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function Reports() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/analytics/dashboard?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch analytics');
        } finally {
            setLoading(false);
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

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-dashboard">
            {/* Header */}
            <div className="reports-header">
                <div>
                    <h1 className="reports-title">Analytics & Reports</h1>
                    <p className="reports-subtitle">Monitor platform performance and gain business insights</p>
                </div>

                {/* Period Selector */}
                <div className="period-selector">
                    <button
                        className={`period-btn ${period === 'week' ? 'active' : ''}`}
                        onClick={() => setPeriod('week')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        className={`period-btn ${period === 'month' ? 'active' : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Last 30 Days
                    </button>
                    <button
                        className={`period-btn ${period === 'year' ? 'active' : ''}`}
                        onClick={() => setPeriod('year')}
                    >
                        Last Year
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon revenue">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Total Revenue</p>
                        <p className="kpi-value">{formatCurrency(analytics?.transactionSummary?.totalVolume)}</p>
                        <p className="kpi-trend">from {formatNumber(analytics?.transactionSummary?.totalCount)} transactions</p>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon users">
                        <span className="material-symbols-outlined">people</span>
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">New Users</p>
                        <p className="kpi-value">{formatNumber(analytics?.users?.reduce((sum, u) => sum + u.count, 0))}</p>
                        <p className="kpi-trend">new users this period</p>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon avg">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Avg. Transaction</p>
                        <p className="kpi-value">{formatCurrency(analytics?.transactionSummary?.avgValue)}</p>
                        <p className="kpi-trend">per transaction</p>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon sellers">
                        <span className="material-symbols-outlined">storefront</span>
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Verified Sellers</p>
                        <p className="kpi-value">
                            {formatNumber(analytics?.sellers?.find(s => s._id === 'approved')?.count || 0)}
                        </p>
                        <p className="kpi-trend">
                            {analytics?.sellers?.find(s => s._id === 'pending')?.count || 0} pending
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="reports-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <span className="material-symbols-outlined">dashboard</span>
                    Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    <span className="material-symbols-outlined">receipt</span>
                    Transactions
                </button>
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <span className="material-symbols-outlined">group</span>
                    Users
                </button>
                <button
                    className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sellers')}
                >
                    <span className="material-symbols-outlined">verified</span>
                    Sellers
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="overview-content">
                    {/* Revenue Summary */}
                    <div className="chart-card">
                        <h3 className="chart-title">Revenue Summary</h3>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <p>Total Revenue</p>
                                <h3>{formatCurrency(analytics?.transactionSummary?.totalVolume)}</h3>
                            </div>
                            <div className="summary-card">
                                <p>Total Transactions</p>
                                <h3>{formatNumber(analytics?.transactionSummary?.totalCount)}</h3>
                            </div>
                            <div className="summary-card">
                                <p>Average Value</p>
                                <h3>{formatCurrency(analytics?.transactionSummary?.avgValue)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Breakdown */}
                    <div className="chart-card">
                        <h3 className="chart-title">Transaction Breakdown</h3>
                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <span className="breakdown-label">Top-ups</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.topUpTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%` }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.topUpTotal)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-label">Purchases</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.purchaseTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%`, background: '#10b981' }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.purchaseTotal)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-label">Bids</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.bidTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%`, background: '#f59e0b' }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.bidTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="activity-card">
                        <h3 className="activity-title">Recent Activity</h3>
                        <div className="activity-list">
                            {analytics?.recentActivity?.length > 0 ? (
                                analytics.recentActivity.slice(0, 5).map((activity, idx) => (
                                    <div key={idx} className="activity-item">
                                        <div className="activity-icon">
                      <span className="material-symbols-outlined">
                        {activity.type === 'topup' ? 'account_balance_wallet' :
                            activity.type === 'purchase' ? 'shopping_cart' : 'gavel'}
                      </span>
                                        </div>
                                        <div className="activity-details">
                                            <p className="activity-user">{activity.userId?.name || 'Unknown User'}</p>
                                            <p className="activity-desc">
                                                {activity.type === 'topup' ? 'Added funds' :
                                                    activity.type === 'purchase' ? 'Made a purchase' : 'Placed a bid'}
                                                of {formatCurrency(activity.amount)}
                                            </p>
                                        </div>
                                        <span className="activity-time">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="transactions-content">
                    <div className="chart-card">
                        <h3 className="chart-title">Transaction Summary</h3>
                        <div className="summary-cards">
                            <div className="summary-card">
                                <p>Total Volume</p>
                                <h3>{formatCurrency(analytics?.transactionSummary?.totalVolume)}</h3>
                            </div>
                            <div className="summary-card">
                                <p>Total Count</p>
                                <h3>{formatNumber(analytics?.transactionSummary?.totalCount)}</h3>
                            </div>
                            <div className="summary-card">
                                <p>Average Value</p>
                                <h3>{formatCurrency(analytics?.transactionSummary?.avgValue)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">Transaction Breakdown by Type</h3>
                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <span className="breakdown-label">💰 Top-ups</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.topUpTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%` }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.topUpTotal)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-label">🛍️ Purchases</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.purchaseTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%`, background: '#10b981' }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.purchaseTotal)}</span>
                            </div>
                            <div className="breakdown-item">
                                <span className="breakdown-label">🔨 Bids</span>
                                <div className="breakdown-bar-container">
                                    <div className="breakdown-bar" style={{ width: `${(analytics?.transactionSummary?.bidTotal / (analytics?.transactionSummary?.totalVolume || 1)) * 100}%`, background: '#f59e0b' }}></div>
                                </div>
                                <span className="breakdown-value">{formatCurrency(analytics?.transactionSummary?.bidTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="users-content">
                    <div className="chart-card">
                        <h3 className="chart-title">User Distribution</h3>
                        <div className="stats-grid-small">
                            {(() => {
                                const roleTotals = {};
                                if (analytics?.users) {
                                    analytics.users.forEach(item => {
                                        const role = item._id.role;
                                        if (!roleTotals[role]) roleTotals[role] = 0;
                                        roleTotals[role] += item.count;
                                    });
                                }
                                return Object.entries(roleTotals).map(([role, count]) => (
                                    <div key={role} className="stat-card-small">
                                        <div className="stat-header-small">
                      <span className="material-symbols-outlined">
                        {role === 'admin' ? 'admin_panel_settings' :
                            role === 'seller' ? 'storefront' : 'person'}
                      </span>
                                            <h4>{role === 'admin' ? 'Admins' : role === 'seller' ? 'Sellers' : 'Buyers'}</h4>
                                        </div>
                                        <p className="stat-value-small">{formatNumber(count)}</p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">User Growth</h3>
                        <div className="user-growth-list">
                            {analytics?.users?.length > 0 ? (
                                analytics.users.map((item, idx) => (
                                    <div key={idx} className="growth-item">
                                        <span className="growth-period">{item._id.month}/{item._id.year}</span>
                                        <span className="growth-role">{item._id.role}</span>
                                        <span className="growth-count">+{item.count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-data">No user growth data available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sellers Tab */}
            {activeTab === 'sellers' && (
                <div className="sellers-content">
                    <div className="chart-card">
                        <h3 className="chart-title">Seller Verification Status</h3>
                        <div className="stats-grid-small">
                            {analytics?.sellers?.map((seller) => (
                                <div key={seller._id} className="stat-card-small">
                                    <div className="stat-header-small">
                    <span className="material-symbols-outlined">
                      {seller._id === 'pending' ? 'hourglass_empty' :
                          seller._id === 'approved' ? 'verified' : 'cancel'}
                    </span>
                                        <h4>{seller._id === 'pending' ? 'Pending' :
                                            seller._id === 'approved' ? 'Verified' : 'Rejected'}</h4>
                                    </div>
                                    <p className="stat-value-small">{formatNumber(seller.count)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="chart-card">
                        <h3 className="chart-title">Gemstone Listings Status</h3>
                        <div className="breakdown-list">
                            {analytics?.gemstones?.map((gem) => (
                                <div key={gem._id} className="breakdown-item">
                  <span className="breakdown-label">
                    {gem._id === 'pending' ? '⏳ Pending' :
                        gem._id === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                                    <div className="breakdown-bar-container">
                                        <div className="breakdown-bar" style={{ width: `${(gem.count / (analytics.gemstones.reduce((sum, g) => sum + g.count, 0) || 1)) * 100}%` }}></div>
                                    </div>
                                    <span className="breakdown-value">{formatNumber(gem.count)}</span>
                                </div>
                            ))}
                            {(!analytics?.gemstones || analytics.gemstones.length === 0) && (
                                <p className="no-data">No gemstone data available</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;