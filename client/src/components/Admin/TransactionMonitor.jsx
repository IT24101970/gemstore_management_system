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
    const [expandedReview, setExpandedReview] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

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
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setTransactions(data.data);
                setSummary(data.summary);
                setTypeBreakdown(data.typeBreakdown || []);
                setPagination((prev) => ({
                    ...prev,
                    total: data.pagination.total,
                    pages: data.pagination.pages
                }));
                setError(null);
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
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
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
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:5000/api/admin/transactions/export/csv';
            if (filters.startDate) url += `?startDate=${filters.startDate}`;
            if (filters.endDate) url += `&endDate=${filters.endDate}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `transactions_${new Date().toISOString()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            alert('Failed to export transactions');
        }
    };

    const handleTopupAction = async (transaction, action) => {
        if (transaction.source !== 'topup' || transaction.status !== 'pending') return;

        try {
            setActionLoadingId(`${transaction._id}-${action}`);
            const token = localStorage.getItem('token');
            const reason = action === 'reject'
                ? window.prompt('Enter rejection reason (optional):') ?? ''
                : '';

            const response = await fetch(`http://localhost:5000/api/admin/transactions/topups/${transaction._id}/${action}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || `Failed to ${action} top-up request`);
            }

            await fetchTransactions();
        } catch (err) {
            alert(err.message || `Failed to ${action} top-up request`);
        } finally {
            setActionLoadingId(null);
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
            purchase: { icon: 'shopping_bag', color: '#2563eb', label: 'Purchase' },
            adjustment: { icon: 'tune', color: '#6b7280', label: 'Adjustment' }
        };
        return icons[type] || { icon: 'receipt', color: '#6b7280', label: type };
    };

    const getStatusBadge = (status) => {
        const config = {
            completed: { class: 'status-approved', label: 'Completed', icon: 'check_circle' },
            approved: { class: 'status-approved', label: 'Approved', icon: 'check_circle' },
            pending: { class: 'status-pending', label: 'Pending', icon: 'schedule' },
            rejected: { class: 'status-rejected', label: 'Rejected', icon: 'cancel' },
            failed: { class: 'status-rejected', label: 'Failed', icon: 'error' },
            cancelled: { class: 'status-closed', label: 'Cancelled', icon: 'cancel' }
        };
        const state = config[status] || config.completed;

        return (
            <span className={`status-badge ${state.class}`}>
                <span className="material-symbols-outlined">{state.icon}</span>
                {state.label}
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
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const pendingTopupReviews = transactions.filter(
        (transaction) => transaction.source === 'topup' && transaction.status === 'pending'
    );

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
                            {transactionTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
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
                            {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>{status.label}</option>
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

            {error && (
                <div className="error-state">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                    <button onClick={fetchTransactions} className="retry-btn">Try Again</button>
                </div>
            )}

            {!error && pendingTopupReviews.length > 0 && (
                <div className="transaction-review-section">
                    <div className="transaction-review-header">
                        <div>
                            <h2 className="transaction-review-title">Pending Top-Up Review</h2>
                            <p className="transaction-review-subtitle">
                                Review receipt-backed wallet requests and approve or reject them from one place.
                            </p>
                        </div>
                        <div className="transaction-review-count">
                            <span className="material-symbols-outlined">schedule</span>
                            {pendingTopupReviews.length} Pending
                        </div>
                    </div>

                    <div className="transaction-review-grid">
                        {pendingTopupReviews.map((transaction) => {
                            const isReviewExpanded = expandedReview === transaction._id;
                            const applicantName = transaction.userId?.name || 'Unknown';
                            const applicantEmail = transaction.userId?.email || 'Not provided';
                            const submittedDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });

                            return (
                                <div key={`review-${transaction._id}`} className="seller-card transaction-review-card">
                                    <div className="card-header">
                                        <div className="seller-info">
                                            <div className="seller-avatar">
                                                <span className="material-symbols-outlined">account_balance_wallet</span>
                                            </div>
                                            <div className="seller-details">
                                                <h3>{transaction.title || 'Wallet Top-Up Request'}</h3>
                                                <p>Ref: {transaction.metadata?.bankReference || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="status-badge status-pending">
                                            <span className="material-symbols-outlined">schedule</span>
                                            Pending Review
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-row">
                                            <div className="info-icon">
                                                <span className="material-symbols-outlined">person</span>
                                            </div>
                                            <div>
                                                <div className="info-label">Applicant</div>
                                                <div className="info-value">{applicantName}</div>
                                            </div>
                                        </div>

                                        <div className="info-row">
                                            <div className="info-icon">
                                                <span className="material-symbols-outlined">mail</span>
                                            </div>
                                            <div>
                                                <div className="info-label">Email</div>
                                                <div className="info-value">{applicantEmail}</div>
                                            </div>
                                        </div>

                                        <div className="info-row">
                                            <div className="info-icon">
                                                <span className="material-symbols-outlined">payments</span>
                                            </div>
                                            <div>
                                                <div className="info-label">Amount</div>
                                                <div className="info-value">{formatCurrency(transaction.amount)}</div>
                                            </div>
                                        </div>

                                        <div className="info-row">
                                            <div className="info-icon">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                            </div>
                                            <div>
                                                <div className="info-label">Submitted</div>
                                                <div className="info-value">{submittedDate}</div>
                                            </div>
                                        </div>

                                        <div className="documents-section">
                                            <button
                                                className="documents-toggle"
                                                onClick={() => setExpandedReview(isReviewExpanded ? null : transaction._id)}
                                                type="button"
                                            >
                                                <span>Receipt & Request Details</span>
                                                <span className="material-symbols-outlined">
                                                    {isReviewExpanded ? 'expand_less' : 'expand_more'}
                                                </span>
                                            </button>

                                            {isReviewExpanded ? (
                                                <div className="documents-list">
                                                    <div className="document-item">
                                                        <div className="document-info">
                                                            <div className="document-icon">
                                                                <span className="material-symbols-outlined">description</span>
                                                            </div>
                                                            <div>
                                                                <div className="transaction-document-title">Receipt Evidence</div>
                                                                <div className="transaction-document-subtitle">
                                                                    Payment method: {transaction.metadata?.paymentMethod || 'bankTransfer'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {transaction.metadata?.receiptImage ? (
                                                            <a
                                                                href={transaction.metadata.receiptImage}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="view-btn"
                                                            >
                                                                <span className="material-symbols-outlined">visibility</span>
                                                                View
                                                            </a>
                                                        ) : (
                                                            <span className="info-value">No receipt</span>
                                                        )}
                                                    </div>
                                                    <div className="document-item">
                                                        <div className="document-info">
                                                            <div className="document-icon">
                                                                <span className="material-symbols-outlined">tag</span>
                                                            </div>
                                                            <div>
                                                                <div className="transaction-document-title">Bank Reference</div>
                                                                <div className="transaction-document-subtitle">
                                                                    {transaction.metadata?.bankReference || 'Not provided'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="info-value">{formatCurrency(transaction.amount)}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            onClick={() => handleTopupAction(transaction, 'approve')}
                                            disabled={actionLoadingId !== null}
                                            className="btn-approve"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            {actionLoadingId === `${transaction._id}-approve` ? 'Approving...' : 'Approve Request'}
                                        </button>
                                        <button
                                            onClick={() => handleTopupAction(transaction, 'reject')}
                                            disabled={actionLoadingId !== null}
                                            className="btn-reject"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            {actionLoadingId === `${transaction._id}-reject` ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!error && (
                <div className="transactions-table-container">
                    {transactions.length > 0 ? (
                        <div className="transaction-card-grid">
                            {transactions.map((transaction) => {
                                const typeInfo = getTypeIcon(transaction.type);
                                const isExpanded = expandedTransaction === transaction._id;
                                const isPendingTopup = transaction.source === 'topup' && transaction.status === 'pending';
                                const amountPrefix = transaction.type === 'deposit'
                                    ? '+'
                                    : ['withdrawal', 'payment', 'purchase'].includes(transaction.type)
                                        ? '-'
                                        : '';

                                return (
                                    <div key={transaction._id} className="seller-card transaction-list-card">
                                        <div className="card-header">
                                            <div className="seller-info">
                                                <div className="seller-avatar" style={{ background: `${typeInfo.color}20` }}>
                                                    <span className="material-symbols-outlined" style={{ color: typeInfo.color }}>
                                                        {typeInfo.icon}
                                                    </span>
                                                </div>
                                                <div className="seller-details">
                                                    <h3>{typeInfo.label}</h3>
                                                    <p>{new Date(transaction.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {getStatusBadge(transaction.status)}
                                        </div>

                                        <div className="card-body">
                                            <div className="transaction-card-topline">
                                                <div>
                                                    <div className="info-label">User</div>
                                                    <div className="info-value">{transaction.userId?.name || 'Unknown'}</div>
                                                    <div className="transaction-card-email">{transaction.userId?.email || 'No email'}</div>
                                                </div>
                                                <div className={`transaction-card-amount ${amountPrefix === '+' ? 'positive' : amountPrefix === '-' ? 'negative' : ''}`}>
                                                    {amountPrefix}{formatCurrency(transaction.amount)}
                                                </div>
                                            </div>

                                            <div className="info-row">
                                                <div className="info-icon">
                                                    <span className="material-symbols-outlined">description</span>
                                                </div>
                                                <div>
                                                    <div className="info-label">Description</div>
                                                    <div className="info-value">{transaction.description || '-'}</div>
                                                </div>
                                            </div>

                                            <div className="transaction-card-meta">
                                                <div className="transaction-meta-pill">
                                                    <span className="material-symbols-outlined">badge</span>
                                                    ID: {transaction._id}
                                                </div>
                                                {transaction.walletId ? (
                                                    <div className="transaction-meta-pill">
                                                        <span className="material-symbols-outlined">account_balance_wallet</span>
                                                        Wallet: {transaction.walletId}
                                                    </div>
                                                ) : null}
                                                {transaction.relatedId ? (
                                                    <div className="transaction-meta-pill">
                                                        <span className="material-symbols-outlined">link</span>
                                                        Related: {transaction.relatedId}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {isPendingTopup ? (
                                                <div className="review-card-hint-inline">Pending top-up request</div>
                                            ) : null}

                                            <div className="documents-section">
                                                <button
                                                    className="documents-toggle"
                                                    onClick={() => setExpandedTransaction(isExpanded ? null : transaction._id)}
                                                    type="button"
                                                >
                                                    <span>Transaction Details</span>
                                                    <span className="material-symbols-outlined">
                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </button>

                                                {isExpanded ? (
                                                    <div className="documents-list">
                                                        <div className="document-item">
                                                            <div className="document-info">
                                                                <div className="document-icon">
                                                                    <span className="material-symbols-outlined">schedule</span>
                                                                </div>
                                                                <div>
                                                                    <div className="transaction-document-title">Last Updated</div>
                                                                    <div className="transaction-document-subtitle">
                                                                        {new Date(transaction.updatedAt).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {transaction.metadata?.bankReference ? (
                                                            <div className="document-item">
                                                                <div className="document-info">
                                                                    <div className="document-icon">
                                                                        <span className="material-symbols-outlined">tag</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="transaction-document-title">Bank Reference</div>
                                                                        <div className="transaction-document-subtitle">{transaction.metadata.bankReference}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {transaction.metadata?.rejectionReason ? (
                                                            <div className="document-item">
                                                                <div className="document-info">
                                                                    <div className="document-icon">
                                                                        <span className="material-symbols-outlined">warning</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="transaction-document-title">Rejection Reason</div>
                                                                        <div className="transaction-document-subtitle">{transaction.metadata.rejectionReason}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        {transaction.metadata?.receiptImage ? (
                                                            <div className="document-item">
                                                                <div className="document-info">
                                                                    <div className="document-icon">
                                                                        <span className="material-symbols-outlined">receipt_long</span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="transaction-document-title">Receipt Evidence</div>
                                                                        <div className="transaction-document-subtitle">Open uploaded payment slip</div>
                                                                    </div>
                                                                </div>
                                                                <a
                                                                    className="view-btn"
                                                                    href={transaction.metadata.receiptImage}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <span className="material-symbols-outlined">visibility</span>
                                                                    View
                                                                </a>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        {isPendingTopup ? (
                                            <div className="card-actions">
                                                <button
                                                    onClick={() => handleTopupAction(transaction, 'approve')}
                                                    disabled={actionLoadingId !== null}
                                                    className="btn-approve"
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined">check_circle</span>
                                                    {actionLoadingId === `${transaction._id}-approve` ? 'Approving...' : 'Approve Request'}
                                                </button>
                                                <button
                                                    onClick={() => handleTopupAction(transaction, 'reject')}
                                                    disabled={actionLoadingId !== null}
                                                    className="btn-reject"
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined">cancel</span>
                                                    {actionLoadingId === `${transaction._id}-reject` ? 'Rejecting...' : 'Reject'}
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <span className="material-symbols-outlined">receipt</span>
                            </div>
                            <h3>No transactions found</h3>
                            <p>Try adjusting your filters to see more results.</p>
                        </div>
                    )}

                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="page-btn"
                            >
                                Previous
                            </button>
                            <span className="page-info">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
