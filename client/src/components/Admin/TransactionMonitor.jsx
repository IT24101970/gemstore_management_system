import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

function TransactionMonitor() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [typeBreakdown, setTypeBreakdown] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: 'all',
        status: 'all',
        minAmount: '',
        maxAmount: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });
    const [expandedTransaction, setExpandedTransaction] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [filters, pagination.page]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/transactions?page=${pagination.page}&limit=${pagination.limit}`;

            if (filters.startDate) url += `&startDate=${filters.startDate}`;
            if (filters.endDate) url += `&endDate=${filters.endDate}`;
            if (filters.type !== 'all') url += `&type=${filters.type}`;
            if (filters.status !== 'all') url += `&status=${filters.status}`;
            if (filters.minAmount) url += `&minAmount=${filters.minAmount}`;
            if (filters.maxAmount) url += `&maxAmount=${filters.maxAmount}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setTransactions(data.data);
                setSummary(data.summary);
                setTypeBreakdown(data.typeBreakdown || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    pages: data.pagination.pages
                }));
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            type: 'all',
            status: 'all',
            minAmount: '',
            maxAmount: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5000/api/admin/transactions/export/csv`;
            if (filters.startDate) url += `?startDate=${filters.startDate}`;
            if (filters.endDate) url += `&endDate=${filters.endDate}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `transactions_${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert('Failed to export transactions');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const getTypeIcon = (type) => {
        const icons = {
            deposit: { icon: 'account_balance_wallet', color: '#10b981', label: 'Deposit' },
            withdrawal: { icon: 'money_off', color: '#ef4444', label: 'Withdrawal' },
            bid: { icon: 'gavel', color: '#f59e0b', label: 'Bid' },
            refund: { icon: 'receipt', color: '#3b82f6', label: 'Refund' },
            payment: { icon: 'payments', color: '#8b5cf6', label: 'Payment' },
            adjustment: { icon: 'tune', color: '#6b7280', label: 'Adjustment' }
        };
        return icons[type] || { icon: 'receipt', color: '#6b7280', label: type };
    };

    const getStatusBadge = (status) => {
        const config = {
            completed: { class: 'status-approved', label: 'Completed', icon: 'check_circle' },
            pending: { class: 'status-pending', label: 'Pending', icon: 'schedule' },
            failed: { class: 'status-rejected', label: 'Failed', icon: 'error' },
            cancelled: { class: 'status-closed', label: 'Cancelled', icon: 'cancel' }
        };
        const s = config[status] || config.completed;
        return (
            <span className={`status-badge ${s.class}`}>
        <span className="material-symbols-outlined">{s.icon}</span>
                {s.label}
      </span>
        );
    };

    const transactionTypes = [
        { value: 'all', label: 'All Types' },
        { value: 'deposit', label: 'Deposits' },
        { value: 'withdrawal', label: 'Withdrawals' },
        { value: 'bid', label: 'Bids' },
        { value: 'refund', label: 'Refunds' },
        { value: 'payment', label: 'Payments' },
        { value: 'adjustment', label: 'Adjustments' }
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    if (loading && transactions.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner">
                    <div className="spinner-icon"></div>
                    <p>Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="transaction-monitor">
            {/* Header */}
            <div className="transaction-header">
                <div>
                    <h1 className="transaction-title">Transaction Monitor</h1>
                    <p className="transaction-subtitle">Track all buying, bidding, and wallet activities</p>
                </div>
                <button onClick={exportCSV} className="export-btn">
                    <span className="material-symbols-outlined">download</span>
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="transaction-stats">
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">payments</span>
                        <h4>Total Volume</h4>
                    </div>
                    <p className="stat-value-small">{formatCurrency(summary?.totalVolume || 0)}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">receipt</span>
                        <h4>Total Transactions</h4>
                    </div>
                    <p className="stat-value-small">{summary?.totalTransactions || 0}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">trending_up</span>
                        <h4>Average Value</h4>
                    </div>
                    <p className="stat-value-small">{formatCurrency(summary?.avgTransaction || 0)}</p>
                </div>
                <div className="stat-card-small">
                    <div className="stat-header-small">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                        <h4>Deposits</h4>
                    </div>
                    <p className="stat-value-small">{formatCurrency(summary?.totalTopups || 0)}</p>
                </div>
            </div>

            {/* Type Breakdown */}
            <div className="type-breakdown">
                {typeBreakdown.map((item) => {
                    const typeInfo = getTypeIcon(item._id);
                    return (
                        <div key={item._id} className="type-card">
                            <div className="type-icon" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>
                                <span className="material-symbols-outlined">{typeInfo.icon}</span>
                            </div>
                            <div className="type-info">
                                <p className="type-label">{typeInfo.label}</p>
                                <p className="type-amount">{formatCurrency(item.total)}</p>
                                <p className="type-count">{item.count} transactions</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="transaction-filters">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Date Range</label>
                        <div className="date-range">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className="filter-input"
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className="filter-input"
                            />
                        </div>
                    </div>
                    <div className="filter-group">
                        <label>Transaction Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="filter-select"
                        >
                            {transactionTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="filter-select"
                        >
                            {statusOptions.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Amount Range</label>
                        <div className="amount-range">
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters.minAmount}
                                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                                className="filter-input"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxAmount}
                                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                                className="filter-input"
                            />
                        </div>
                    </div>
                    <button onClick={resetFilters} className="reset-btn">
                        <span className="material-symbols-outlined">refresh</span>
                        Reset
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button onClick={fetchTransactions} className="retry-btn">Try Again</button>
                </div>
            )}

            {/* Transactions Table */}
            {!error && (
                <div className="transactions-table-container">
                    <table className="transactions-table">
                        <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactions.map((transaction) => {
                            const typeInfo = getTypeIcon(transaction.type);
                            const isExpanded = expandedTransaction === transaction._id;

                            return (
                                <React.Fragment key={transaction._id}>
                                    <tr className="transaction-row">
                                        <td className="date-cell">
                                            {new Date(transaction.createdAt).toLocaleString()}
                                        </td>
                                        <td className="user-cell">
                                            <div className="user-info">
                                                <span className="user-name">{transaction.userId?.name || 'Unknown'}</span>
                                                <span className="user-email">{transaction.userId?.email || ''}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="type-badge" style={{ color: typeInfo.color }}>
                                                <span className="material-symbols-outlined">{typeInfo.icon}</span>
                                                {typeInfo.label}
                                            </div>
                                        </td>
                                        <td className={`amount-cell ${transaction.type === 'deposit' ? 'positive' : transaction.type === 'withdrawal' ? 'negative' : ''}`}>
                                            {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                                            {formatCurrency(transaction.amount)}
                                        </td>
                                        <td>{getStatusBadge(transaction.status)}</td>
                                        <td className="description-cell">
                                            {transaction.description || '—'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setExpandedTransaction(isExpanded ? null : transaction._id)}
                                                className="expand-btn"
                                            >
                          <span className="material-symbols-outlined">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="expanded-row">
                                            <td colSpan="7">
                                                <div className="expanded-details">
                                                    <div className="detail-section">
                                                        <h4>Transaction Details</h4>
                                                        <div className="detail-grid">
                                                            <div className="detail-item">
                                                                <span className="detail-label">Transaction ID:</span>
                                                                <span className="detail-value">{transaction._id}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">Wallet ID:</span>
                                                                <span className="detail-value">{transaction.walletId}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">Related ID:</span>
                                                                <span className="detail-value">{transaction.relatedId || 'N/A'}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">Created:</span>
                                                                <span className="detail-value">{new Date(transaction.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <div className="detail-item">
                                                                <span className="detail-label">Last Updated:</span>
                                                                <span className="detail-value">{new Date(transaction.updatedAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {transactions.length === 0 && !loading && (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <span className="material-symbols-outlined">receipt</span>
                            </div>
                            <h3>No transactions found</h3>
                            <p>Try adjusting your filters to see more results.</p>
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
                            <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="page-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default TransactionMonitor;