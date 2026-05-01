import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { walletAPI } from '../services/walletAPI.js';
import './Wallet.css';

const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});

const statusClassMap = {
    completed: 'completed',
    pending: 'pending',
    rejected: 'rejected',
    failed: 'rejected',
    cancelled: 'rejected',
    approved: 'completed',
};

const MIN_TOP_UP_AMOUNT = 20;
const BANK_REFERENCE_PATTERN = /^[A-Za-z0-9]+$/;

function SummaryCard({ label, value, info, warning = false }) {
    return (
        <div className="hold-card">
            <div className="hold-content">
                <p className="hold-label">{label}</p>
                <p className="hold-amount">{value}</p>
                {info ? (
                    <p className="hold-info" style={warning ? undefined : { color: '#0f766e' }}>
                        <span className="material-symbols-outlined">info</span>
                        {info}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export default function WalletDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const requestSectionRef = useRef(null);
    const reportSectionRef = useRef(null);
    const amountInputRef = useRef(null);

    const [wallet, setWallet] = useState({
        availableBalance: 0,
        fundsOnHold: 0,
        pendingTransactions: 0,
        equity: 0,
    });
    const [transactions, setTransactions] = useState([]);
    const [topupRequests, setTopupRequests] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ amount: '', reference: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [balance, setBalance] = useState(0); // ✅ Add balance state

    const userProfile = useMemo(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
                return { name: 'User', role: 'Member' };
            }

            const parsedUser = JSON.parse(storedUser);
            const name = parsedUser?.name || parsedUser?.businessName || 'User';
            const role = parsedUser?.role
                ? parsedUser.role.charAt(0).toUpperCase() + parsedUser.role.slice(1)
                : 'Member';

            return { name, role };
        } catch (error) {
            return { name: 'User', role: 'Member' };
        }
    }, []);

    const monthlyIncrease = useMemo(() => {
        const base = Number(wallet?.equity) || 0;
        if (base <= 0) return '0.0';
        return (((Number(wallet.availableBalance) - base) / base) * 100).toFixed(1);
    }, [wallet]);

    const pendingCount = Number(wallet?.pendingTransactions) || 0;

    const filteredData = useMemo(() => {
        if (filter === 'topups') {
            return topupRequests;
        } else {
            if (filter === 'all') return transactions;
            if (filter === 'income') {
                return transactions.filter((item) => item.type === 'income');
            }
            if (filter === 'expense') {
                return transactions.filter((item) => item.type === 'expense');
            }
            return transactions;
        }
    }, [filter, transactions, topupRequests]);

    const reportSummary = useMemo(() => {
        return transactions.reduce(
            (summary, item) => {
                const amount = Math.abs(Number(item.amount) || 0);

                if (item.type === 'income') {
                    summary.income += amount;
                } else if (item.type === 'expense') {
                    summary.expense += amount;
                }

                if (item.status === 'pending') {
                    summary.pending += 1;
                }

                summary.total += 1;
                return summary;
            },
            { income: 0, expense: 0, pending: 0, total: 0 }
        );
    }, [transactions]);

    // ✅ Update balance when wallet data changes
    useEffect(() => {
        if (wallet?.availableBalance) {
            setBalance(wallet.availableBalance);
        }
    }, [wallet?.availableBalance]);

    const loadData = async () => {
        setLoading(true);

        try {
            const [walletData, transactionData, topupData] = await Promise.all([
                walletAPI.getSummary(),
                walletAPI.getWalletDashboardTransactions(),
                walletAPI.getTopupRequests(),
            ]);

            setWallet(
                walletData || { availableBalance: 0, fundsOnHold: 0, pendingTransactions: 0, equity: 0 }
            );
            setTransactions(Array.isArray(transactionData) ? transactionData : []);
            setTopupRequests(Array.isArray(topupData) ? topupData : []);
            setPageError('');
        } catch (error) {
            setPageError(error.message || 'Failed to load wallet data.');
            setWallet({ availableBalance: 0, fundsOnHold: 0, pendingTransactions: 0, equity: 0 });
            setTransactions([]);
            setTopupRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // ✅ Override logout to use passed onLogout prop
    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const scrollToRequest = () => {
        setShowReport(false);
        window.setTimeout(() => {
            requestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            amountInputRef.current?.focus();
        }, 50);
    };

    const openReport = () => {
        setShowReport(true);
        window.setTimeout(() => {
            reportSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const exportReport = () => {
        const rows = [
            ['Date', 'Reference', 'Title', 'Type', 'Status', 'Amount'],
            ...transactions.map((item) => [
                item.createdAt ? new Date(item.createdAt).toISOString() : '',
                item.metadata?.referenceNumber || item.reference || '',
                item.title || item.description || 'Wallet Transaction',
                item.type || '',
                item.status || '',
                String(item.amount ?? ''),
            ]),
        ];

        const csvContent = rows
            .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'wallet-report.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setReceiptFile(null);
            setReceiptPreview(null);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setFormError('File size must be less than 10MB');
            setReceiptFile(null);
            setReceiptPreview(null);
            return;
        }

        setReceiptFile(file);
        setFormError('');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setReceiptPreview(null);
        }
    };

    const handleRemoveFile = () => {
        setReceiptFile(null);
        setReceiptPreview(null);
        setFormError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        const numericAmount = Number(formData.amount);
        const trimmedReference = formData.reference.trim();

        if (!receiptFile) {
            setFormError('Please upload a receipt before submitting your request.');
            setFormSuccess('');
            return;
        }

        if (!Number.isFinite(numericAmount) || numericAmount < MIN_TOP_UP_AMOUNT) {
            setFormError(`Amount must be at least USD ${MIN_TOP_UP_AMOUNT.toLocaleString('en-US')}.`);
            setFormSuccess('');
            return;
        }

        if (trimmedReference.length <= 3) {
            setFormError('Bank reference number must be more than 3 characters.');
            setFormSuccess('');
            return;
        }

        if (!BANK_REFERENCE_PATTERN.test(trimmedReference)) {
            setFormError('Bank reference number can only contain letters and numbers.');
            setFormSuccess('');
            return;
        }

        setFormError('');
        setFormSuccess('');

        try {
            setSubmitting(true);
            setUploading(true);

            const data = new FormData();
            data.append('amount', String(numericAmount));
            data.append('reference', trimmedReference);
            data.append('receipt', receiptFile);

            console.log('📤 Uploading receipt to Cloudinary...');
            await walletAPI.requestTopupWithReceipt(data);

            setFormSuccess('✅ Top-up request submitted for admin approval.');
            setFormData({ amount: '', reference: '' });
            setReceiptFile(null);
            setReceiptPreview(null);

            console.log('✅ Receipt uploaded successfully');
            await loadData();
        } catch (error) {
            console.error('❌ Upload error:', error);
            setFormError(error.message || 'Failed to submit top-up request.');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    const totalRows = filteredData.length;
    const isTopupFilter = filter === 'topups';

    return (
        <div className="wallet-wrapper">
            {/* NavBar */}
            <NavBar user={user} onLogout={handleLogout} balance={balance} />

            <main className="wallet-main">
                {pageError ? (
                    <div
                        style={{
                            maxWidth: '1180px',
                            margin: '0 auto 1rem',
                            padding: '0.9rem 1rem',
                            borderRadius: '16px',
                            background: '#fff7ed',
                            border: '1px solid #fdba74',
                            color: '#9a3412',
                            fontWeight: 600
                        }}
                    >
                        {pageError}
                    </div>
                ) : null}

                <div className="balance-grid">
                    <div className="balance-hero">
                        <div className="hero-bg-icon">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <div className="hero-content">
                            <div className="hero-header">
                                <div>
                                    <p className="balance-label">Total Available Balance</p>
                                    <h1 className="balance-amount">
                                        {moneyFormatter.format(Number(wallet.availableBalance) || 0)}
                                    </h1>
                                    <p className="balance-trend">
                                        <span className="material-symbols-outlined">trending_up</span>
                                        {monthlyIncrease}% increase from last month
                                    </p>
                                </div>
                                <div className="live-badge">
                                    <span className="live-dot"></span>
                                    Live Updates
                                </div>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <button className="hero-btn secondary" type="button" onClick={scrollToRequest}>
                                <span className="material-symbols-outlined">request_quote</span>
                                <span>Request Top-Up</span>
                            </button>
                            <button className="hero-btn tertiary" type="button" onClick={openReport}>
                                <span className="material-symbols-outlined">history</span>
                                <span>View Report</span>
                            </button>
                        </div>
                    </div>

                    <div className="hold-card">
                        <div className="hold-bg-icon">
                            <span className="material-symbols-outlined">lock_clock</span>
                        </div>
                        <div className="hold-content">
                            <div className="hold-icon-wrapper">
                                <span className="material-symbols-outlined">pending</span>
                            </div>
                            <p className="hold-label">Funds on Hold</p>
                            <p className="hold-amount">{moneyFormatter.format(Number(wallet.fundsOnHold) || 0)}</p>
                            <p className="hold-info">
                                <span className="material-symbols-outlined">info</span>
                                {pendingCount} Active Transactions Pending
                            </p>
                        </div>
                    </div>
                </div>

                {showReport ? (
                    <section ref={reportSectionRef} className="transactions-section">
                        <div className="section-header">
                            <h3 className="section-title">Transaction Report</h3>
                            <div className="filter-tabs">
                                <button className="filter-tab active" type="button" onClick={exportReport}>
                                    Export CSV
                                </button>
                                <button className="filter-tab" type="button" onClick={() => setShowReport(false)}>
                                    Close Report
                                </button>
                            </div>
                        </div>

                        <div className="balance-grid">
                            <SummaryCard
                                label="Report Entries"
                                value={String(reportSummary.total)}
                                info="Total transactions tracked"
                            />
                            <SummaryCard
                                label="Income"
                                value={moneyFormatter.format(reportSummary.income)}
                                info="Approved incoming funds"
                            />
                            <SummaryCard
                                label="Expense"
                                value={moneyFormatter.format(reportSummary.expense)}
                                info="Outgoing wallet activity"
                            />
                        </div>
                    </section>
                ) : null}

                <div className="transactions-layout">
                    <div className="transactions-section">
                        <div className="section-header">
                            <h3 className="section-title">
                                {isTopupFilter ? 'Top-Up Requests' : 'Recent Transactions'}
                            </h3>
                            <div className="filter-tabs">
                                {['all', 'income', 'expense', 'topups'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`filter-tab ${filter === tab ? 'active' : ''}`}
                                        onClick={() => setFilter(tab)}
                                        type="button"
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="table-card">
                            <div className="table-wrapper">
                                <table className="transactions-table">
                                    <thead>
                                    <tr>
                                        <th>Date &amp; ID</th>
                                        <th>Description</th>
                                        <th className="text-right">Amount</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">
                                            {isTopupFilter ? 'Receipt' : 'Action'}
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5}>Loading {isTopupFilter ? 'top-up requests' : 'transactions'}...</td>
                                        </tr>
                                    ) : filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                No {isTopupFilter ? 'top-up requests' : 'transactions'} found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredData.map((item) => (
                                            <tr key={item._id || item.id || `${item.createdAt}-${item.amount}`}>
                                                <td>
                                                    <p className="tx-date">
                                                        {item.createdAt
                                                            ? shortDate.format(new Date(item.createdAt))
                                                            : item.requestedAt
                                                                ? shortDate.format(new Date(item.requestedAt))
                                                                : 'N/A'}
                                                    </p>
                                                    <p className="tx-id">
                                                        #{isTopupFilter ? item.bankReference : item.metadata?.referenceNumber || 'N/A'}
                                                    </p>
                                                </td>
                                                <td>
                                                    <div className="tx-description">
                                                        <div className={`tx-icon ${isTopupFilter ? 'income' : item.type === 'income' ? 'income' : 'purchase'}`}>
                                <span className="material-symbols-outlined">
                                  {isTopupFilter ? 'payments' : item.type === 'income' ? 'arrow_downward' : 'payments'}
                                </span>
                                                        </div>
                                                        <div>
                                                            <p className="tx-name">
                                                                {isTopupFilter
                                                                    ? `Wallet Top-Up - ${item.paymentMethod || 'Bank Transfer'}`
                                                                    : item.title || item.description || 'Wallet Transaction'}
                                                            </p>
                                                            <p className="tx-method">
                                                                {isTopupFilter
                                                                    ? `Ref: ${item.bankReference}`
                                                                    : item.subtitle || item.type || 'Wallet activity'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right">
                            <span className={`tx-amount ${isTopupFilter || item.type === 'income' ? 'income' : ''}`}>
                              {isTopupFilter || item.type === 'income' ? '+ ' : '- '}
                                {moneyFormatter.format(Math.abs(Number(item.amount) || 0))}
                            </span>
                                                </td>
                                                <td className="text-center">
                            <span className={`status-badge ${statusClassMap[item.status] || 'pending'}`}>
                              <span className="status-dot"></span>
                                {item.status || 'pending'}
                            </span>
                                                </td>
                                                <td className="text-center">
                                                    {isTopupFilter ? (
                                                        item.receiptImage ? (
                                                            <a
                                                                href={item.receiptImage}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="action-btn"
                                                                title="View Receipt"
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    description
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                                N/A
                                                            </span>
                                                        )
                                                    ) : (
                                                        <button
                                                            className="action-btn"
                                                            type="button"
                                                            onClick={openReport}
                                                        >
                                                            <span className="material-symbols-outlined">visibility</span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="table-footer">
                <span className="footer-text">
                  Showing <span className="font-medium">1</span> to{' '}
                    <span className="font-medium">{totalRows}</span> of{' '}
                    <span className="font-medium">{totalRows}</span> results
                </span>
                                <div className="pagination">
                                    <button className="page-btn" type="button" disabled>
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button className="page-btn" type="button" disabled={totalRows === 0}>
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="request-sidebar" ref={requestSectionRef}>
                        <div className="request-card">
                            <div className="request-header">
                                <div className="request-icon">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <div>
                                    <h3 className="request-title">Quick Request</h3>
                                    <p className="request-subtitle">Submit a receipt-backed request for admin approval.</p>
                                </div>
                            </div>

                            <form className="request-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="amount">Amount (USD)</label>
                                    <div className="input-with-prefix">
                                        <span className="input-prefix">USD</span>
                                        <input
                                            ref={amountInputRef}
                                            className="form-input"
                                            id="amount"
                                            name="amount"
                                            placeholder="50,000.00"
                                            type="number"
                                            step="0.01"
                                            min={MIN_TOP_UP_AMOUNT}
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="reference">Bank Reference Number</label>
                                    <div className="input-with-icon">
                                        <span className="material-symbols-outlined input-icon">tag</span>
                                        <input
                                            className="form-input with-icon"
                                            id="reference"
                                            name="reference"
                                            placeholder="Enter reference ID"
                                            type="text"
                                            value={formData.reference}
                                            onChange={handleInputChange}
                                            minLength={4}
                                            pattern="[A-Za-z0-9]+"
                                            title="Can't include Symbols (.@#$%)"
                                            onInvalid={(event) => event.target.setCustomValidity("Can't include Symbols (.@#$%)")}
                                            onInput={(event) => event.target.setCustomValidity('')}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="receipt">Upload Receipt</label>

                                    {receiptPreview ? (
                                        <div style={{
                                            position: 'relative',
                                            marginBottom: '15px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '2px solid #e5e7eb',
                                            maxHeight: '200px'
                                        }}>
                                            <img
                                                src={receiptPreview}
                                                alt="Receipt Preview"
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    background: 'rgba(220, 38, 38, 0.9)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '40px',
                                                    height: '40px',
                                                    cursor: 'pointer',
                                                    fontSize: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : receiptFile ? (
                                        <div style={{
                                            padding: '15px',
                                            marginBottom: '15px',
                                            borderRadius: '8px',
                                            border: '2px solid #e5e7eb',
                                            backgroundColor: '#f9fafb',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>
                          {receiptFile.type === 'application/pdf' ? 'picture_as_pdf' : 'description'}
                        </span>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
                                                        {receiptFile.name}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
                                                        {(receiptFile.size / 1024).toFixed(2)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                style={{
                                                    background: 'rgba(220, 38, 38, 0.1)',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="file-upload">
                                            <label htmlFor="receipt" style={{ cursor: 'pointer', width: '100%' }}>
                                                <div className="file-upload-content">
                                                    <div className="upload-icon-wrapper">
                                                        <span className="material-symbols-outlined">
                                                            {uploading ? 'cloud_sync' : 'cloud_upload'}
                                                        </span>
                                                    </div>
                                                    <div className="upload-text">
                                                        <span>Upload a file</span>
                                                    </div>
                                                    <p className="upload-hint">
                                                        {uploading ? 'Uploading to cloud...' : 'PNG, JPG, PDF up to 10MB'}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    <input
                                        className="sr-only"
                                        id="receipt"
                                        name="receipt"
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.pdf"
                                        required
                                        onChange={handleFileChange}
                                        onClick={(e) => {e.currentTarget.value = '';}}
                                    />
                                </div>

                                {formError ? (
                                    <p style={{ color: '#b91c1c', fontSize: '0.875rem', fontWeight: 600 }}>{formError}</p>
                                ) : null}

                                {formSuccess ? (
                                    <p style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600 }}>{formSuccess}</p>
                                ) : null}

                                <button
                                    className="submit-btn"
                                    type="submit"
                                    disabled={submitting || uploading}
                                >
                                    <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="wallet-footer">
                    <p>Secure payments powered by Ceylon Gems Financial Services. All transactions are encrypted.</p>
                </div>
            </main>
        </div>
    );
}