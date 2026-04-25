import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profile, setProfile] = useState(null);

    // ── Profile form state ──
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        shippingAddress: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Sri Lanka'
        },
        businessName: '',
        businessRegistration: ''
    });

    // ── Password state ──
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        newPw: false,
        confirm: false
    });

    // ── Report state ──
    const [reportData, setReportData] = useState({
        category: '',
        subject: '',
        description: '',
        priority: 'medium'
    });
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [pastReports, setPastReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);

    const reportCategories = [
        { value: 'payment',   label: '💳 Payment Issue',    desc: 'Problems with transactions or billing' },
        { value: 'order',     label: '📦 Order Problem',     desc: 'Issues with a purchase or delivery' },
        { value: 'account',   label: '👤 Account Access',    desc: 'Login, verification or account issues' },
        { value: 'listing',   label: '💎 Gem Listing',       desc: 'Incorrect or fraudulent listings' },
        { value: 'auction',   label: '🔨 Auction Issue',     desc: 'Problems with bidding or auctions' },
        { value: 'seller',    label: '🏪 Seller Conduct',    desc: "Report a seller's behaviour" },
        { value: 'technical', label: '⚙️ Technical Bug',     desc: 'App errors or unexpected behaviour' },
        { value: 'other',     label: '📝 Other',             desc: 'Something not listed above' },
    ];

    const reportStatusConfig = {
        open:       { label: 'Open',        color: '#2563eb', bg: '#dbeafe' },
        inprogress: { label: 'In Progress', color: '#d97706', bg: '#fef3c7' },
        resolved:   { label: 'Resolved',    color: '#16a34a', bg: '#dcfce7' },
        closed:     { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
    };

    const statusConfig = {
        approved: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Approved', icon: '✓' },
        rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Rejected', icon: '✕' },
        pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending',  icon: '⏳' },
    };

    // ── Fetch profile on mount ──
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
                    setFormData({
                        name: data.data.name || '',
                        email: data.data.email || '',
                        phoneNumber: data.data.phoneNumber || '',
                        shippingAddress: {
                            street: data.data.shippingAddress?.street || '',
                            city: data.data.shippingAddress?.city || '',
                            state: data.data.shippingAddress?.state || '',
                            postalCode: data.data.shippingAddress?.postalCode || '',
                            country: data.data.shippingAddress?.country || 'Sri Lanka'
                        },
                        businessName: data.data.businessName || '',
                        businessRegistration: data.data.businessRegistration || ''
                    });
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setFetchLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // ── Fetch past reports when report tab opens ──
    useEffect(() => {
        if (activeTab === 'report') {
            fetchPastReports();
        }
    }, [activeTab]);

    const fetchPastReports = async () => {
        setReportsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/reports/my-reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) setPastReports(data.data || []);
        } catch (err) {
            setPastReports([]);
        } finally {
            setReportsLoading(false);
        }
    };

    // ── Handlers ──
    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('shippingAddress.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                shippingAddress: { ...prev.shippingAddress, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleReportChange = (e) => {
        const { name, value } = e.target;
        setReportData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setProfile(data.data);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setEditMode(false);
            } else {
                setMessage({ type: 'error', text: data.message || 'Update failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Password change failed' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phoneNumber: profile.phoneNumber || '',
                shippingAddress: {
                    street: profile.shippingAddress?.street || '',
                    city: profile.shippingAddress?.city || '',
                    state: profile.shippingAddress?.state || '',
                    postalCode: profile.shippingAddress?.postalCode || '',
                    country: profile.shippingAddress?.country || 'Sri Lanka'
                },
                businessName: profile.businessName || '',
                businessRegistration: profile.businessRegistration || ''
            });
        }
        setEditMode(false);
        setMessage({ type: '', text: '' });
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportData.category) {
            setMessage({ type: 'error', text: 'Please select a problem category.' });
            return;
        }
        if (!reportData.subject.trim()) {
            setMessage({ type: 'error', text: 'Please enter a subject.' });
            return;
        }
        if (reportData.description.trim().length < 20) {
            setMessage({ type: 'error', text: 'Description must be at least 20 characters.' });
            return;
        }
        setReportLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reportData)
            });
            const data = await response.json();
            if (data.success) {
                setReportSubmitted(true);
                setReportData({ category: '', subject: '', description: '', priority: 'medium' });
                fetchPastReports();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to submit report.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
        } finally {
            setReportLoading(false);
        }
    };

    // ── Tabs ──
    const tabs = [
        { id: 'personal', label: 'Personal',  icon: '👤' },
        { id: 'address',  label: 'Address',   icon: '📍' },
        { id: 'security', label: 'Security',  icon: '🔒' },
        { id: 'auctions', label: 'My Auctions', icon: '🏆', action: 'navigate' },
        ...(profile?.role === 'seller' || profile?.becomeSeller
            ? [
                { id: 'business', label: 'Business',    icon: '🏪' },
                { id: 'bids',     label: 'Bids Report', icon: '📊', action: 'navigate' }
            ]
            : []),
        { id: 'report', label: 'Report Problem', icon: '🚨' },
    ];

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleTabClick = (tab) => {
        if (tab.action === 'navigate') {
            if (tab.id === 'auctions') navigate('/auction-participation-report');
            if (tab.id === 'bids')     navigate('/seller-bids-report');
            return;
        }
        setActiveTab(tab.id);
        setMessage({ type: '', text: '' });
        setEditMode(false);
        setReportSubmitted(false);
    };

    return (
        <div className="pp-root">
            <div className="pp-orb pp-orb-1" />
            <div className="pp-orb pp-orb-2" />
            <div className="pp-orb pp-orb-3" />

            <div className="pp-layout">

                {/* ── Sidebar ── */}
                <aside className="pp-sidebar">
                    <button className="pp-back" onClick={() => navigate('/home')}>
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
                            <p className="pp-since">Member since {new Date(profile.createdAt).getFullYear()}</p>
                        )}
                    </div>

                    <nav className="pp-nav">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`pp-nav-item ${activeTab === tab.id ? 'pp-nav-active' : ''} ${tab.id === 'report' ? 'pp-nav-report' : ''}`}
                                onClick={() => handleTabClick(tab)}
                            >
                                <span className="pp-nav-icon">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {activeTab === tab.id && !tab.action && <span className="pp-nav-dot" />}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* ── Main ── */}
                <main className="pp-main">
                    {fetchLoading ? (
                        <div className="pp-loading">
                            <div className="pp-spinner" />
                            <span>Loading profile…</span>
                        </div>
                    ) : (
                        <>
                            {message.text && (
                                <div className={`pp-banner pp-banner-${message.type}`}>
                                    <span>{message.type === 'success' ? '✓' : '!'}</span>
                                    {message.text}
                                </div>
                            )}

                            {/* ── Personal ── */}
                            {activeTab === 'personal' && (
                                <div className="pp-section">
                                    <div className="pp-section-head">
                                        <div>
                                            <h3 className="pp-section-title">Personal Information</h3>
                                            <p className="pp-section-sub">Manage your name, email and contact details</p>
                                        </div>
                                        {!editMode && (
                                            <button className="pp-edit-btn" onClick={() => setEditMode(true)}>
                                                <span>✎</span> Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="pp-fields">
                                        <div className="pp-field">
                                            <label className="pp-label">Full Name</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
                                                : <div className="pp-value">{profile?.name || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">Email Address</label>
                                            {editMode
                                                ? <input className="pp-input" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" />
                                                : <div className="pp-value">{profile?.email || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">Phone Number</label>
                                            {editMode
                                                ? <input className="pp-input" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+94 77 123 4567" />
                                                : <div className="pp-value">{profile?.phoneNumber || '—'}</div>}
                                        </div>
                                        <div className="pp-field pp-field-readonly">
                                            <label className="pp-label">Account Role</label>
                                            <div className="pp-value"><span className="pp-role-pill">{profile?.role || 'buyer'}</span></div>
                                        </div>
                                        <div className="pp-field pp-field-readonly">
                                            <label className="pp-label">Member Since</label>
                                            <div className="pp-value">
                                                {profile?.createdAt
                                                    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    {editMode && (
                                        <div className="pp-actions">
                                            <button className="pp-btn-ghost" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pp-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? <span className="pp-btn-spinner" /> : '✓'} {loading ? 'Saving…' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Address ── */}
                            {activeTab === 'address' && (
                                <div className="pp-section">
                                    <div className="pp-section-head">
                                        <div>
                                            <h3 className="pp-section-title">Shipping Address</h3>
                                            <p className="pp-section-sub">Your default delivery address</p>
                                        </div>
                                        {!editMode && (
                                            <button className="pp-edit-btn" onClick={() => setEditMode(true)}>
                                                <span>✎</span> Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="pp-fields">
                                        <div className="pp-field pp-field-full">
                                            <label className="pp-label">Street Address</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="shippingAddress.street" value={formData.shippingAddress.street} onChange={handleChange} placeholder="123 Main Street" />
                                                : <div className="pp-value">{profile?.shippingAddress?.street || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">City</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="shippingAddress.city" value={formData.shippingAddress.city} onChange={handleChange} placeholder="Colombo" />
                                                : <div className="pp-value">{profile?.shippingAddress?.city || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">State / Province</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="shippingAddress.state" value={formData.shippingAddress.state} onChange={handleChange} placeholder="Western" />
                                                : <div className="pp-value">{profile?.shippingAddress?.state || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">Postal Code</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="shippingAddress.postalCode" value={formData.shippingAddress.postalCode} onChange={handleChange} placeholder="00100" />
                                                : <div className="pp-value">{profile?.shippingAddress?.postalCode || '—'}</div>}
                                        </div>
                                        <div className="pp-field">
                                            <label className="pp-label">Country</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="shippingAddress.country" value={formData.shippingAddress.country} onChange={handleChange} />
                                                : <div className="pp-value">{profile?.shippingAddress?.country || 'Sri Lanka'}</div>}
                                        </div>
                                    </div>
                                    {editMode && (
                                        <div className="pp-actions">
                                            <button className="pp-btn-ghost" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pp-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? <span className="pp-btn-spinner" /> : '✓'} {loading ? 'Saving…' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Security ── */}
                            {activeTab === 'security' && (
                                <div className="pp-section">
                                    <div className="pp-section-head">
                                        <div>
                                            <h3 className="pp-section-title">Change Password</h3>
                                            <p className="pp-section-sub">Keep your account secure with a strong password</p>
                                        </div>
                                    </div>
                                    <form onSubmit={handleChangePassword}>
                                        <div className="pp-fields">
                                            <div className="pp-field pp-field-full">
                                                <label className="pp-label">Current Password</label>
                                                <div className="pp-input-wrap">
                                                    <input className="pp-input" type={showPasswords.current ? 'text' : 'password'} placeholder="••••••••"
                                                           value={passwordData.currentPassword}
                                                           onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} required />
                                                    <button type="button" className="pp-eye" onClick={() => toggleShowPassword('current')} tabIndex={-1}>
                                                        {showPasswords.current ? '🙈' : '👁'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pp-field">
                                                <label className="pp-label">New Password</label>
                                                <div className="pp-input-wrap">
                                                    <input className="pp-input" type={showPasswords.newPw ? 'text' : 'password'} placeholder="••••••••"
                                                           value={passwordData.newPassword}
                                                           onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required />
                                                    <button type="button" className="pp-eye" onClick={() => toggleShowPassword('newPw')} tabIndex={-1}>
                                                        {showPasswords.newPw ? '🙈' : '👁'}
                                                    </button>
                                                </div>
                                                <span className="pp-hint">Minimum 6 characters</span>
                                            </div>
                                            <div className="pp-field">
                                                <label className="pp-label">Confirm New Password</label>
                                                <div className="pp-input-wrap">
                                                    <input className="pp-input" type={showPasswords.confirm ? 'text' : 'password'} placeholder="••••••••"
                                                           value={passwordData.confirmPassword}
                                                           onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} required />
                                                    <button type="button" className="pp-eye" onClick={() => toggleShowPassword('confirm')} tabIndex={-1}>
                                                        {showPasswords.confirm ? '🙈' : '👁'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pp-actions">
                                            <button type="submit" className="pp-btn-primary" disabled={loading}>
                                                {loading ? <span className="pp-btn-spinner" /> : '🔒'} {loading ? 'Updating…' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ── Business ── */}
                            {activeTab === 'business' && (
                                <div className="pp-section">
                                    <div className="pp-section-head">
                                        <div>
                                            <h3 className="pp-section-title">Business Information</h3>
                                            <p className="pp-section-sub">Your seller profile and verification status</p>
                                        </div>
                                        {!editMode && (
                                            <button className="pp-edit-btn" onClick={() => setEditMode(true)}>
                                                <span>✎</span> Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="pp-fields">
                                        <div className="pp-field pp-field-full">
                                            <label className="pp-label">Business Name</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="GemLanka Trading Co." />
                                                : <div className="pp-value">{profile?.businessName || '—'}</div>}
                                        </div>
                                        <div className="pp-field pp-field-full">
                                            <label className="pp-label">Business Registration Number</label>
                                            {editMode
                                                ? <input className="pp-input" type="text" name="businessRegistration" value={formData.businessRegistration} onChange={handleChange} placeholder="PV123456" />
                                                : <div className="pp-value">{profile?.businessRegistration || '—'}</div>}
                                        </div>
                                        <div className="pp-field pp-field-full">
                                            <label className="pp-label">Verification Status</label>
                                            <div className="pp-value">
                                                {(() => {
                                                    const s = profile?.sellerStatus || 'pending';
                                                    const cfg = statusConfig[s] || statusConfig.pending;
                                                    return (
                                                        <span className="pp-status-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    {editMode && (
                                        <div className="pp-actions">
                                            <button className="pp-btn-ghost" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pp-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? <span className="pp-btn-spinner" /> : '✓'} {loading ? 'Saving…' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Report a Problem ── */}
                            {activeTab === 'report' && (
                                <div className="pp-section">
                                    <div className="pp-section-head">
                                        <div>
                                            <h3 className="pp-section-title">Report a Problem</h3>
                                            <p className="pp-section-sub">Let us know what went wrong — we'll look into it promptly</p>
                                        </div>
                                    </div>

                                    {reportSubmitted ? (
                                        <div className="pp-report-success">
                                            <div className="pp-report-success-icon">✓</div>
                                            <h4>Report Submitted!</h4>
                                            <p>Thank you for letting us know. Our support team will review your report and get back to you within 1–2 business days.</p>
                                            <button className="pp-btn-primary" onClick={() => setReportSubmitted(false)}>
                                                Submit Another Report
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitReport}>
                                            {/* Category grid */}
                                            <div className="pp-field pp-field-full" style={{ marginBottom: '1.25rem' }}>
                                                <label className="pp-label">Problem Category</label>
                                                <div className="pp-report-categories">
                                                    {reportCategories.map(cat => (
                                                        <button
                                                            key={cat.value}
                                                            type="button"
                                                            className={`pp-report-cat ${reportData.category === cat.value ? 'pp-report-cat-active' : ''}`}
                                                            onClick={() => setReportData(prev => ({ ...prev, category: cat.value }))}
                                                        >
                                                            <span className="pp-report-cat-label">{cat.label}</span>
                                                            <span className="pp-report-cat-desc">{cat.desc}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pp-fields">
                                                <div className="pp-field pp-field-full">
                                                    <label className="pp-label">Subject</label>
                                                    <input className="pp-input" type="text" name="subject"
                                                           value={reportData.subject} onChange={handleReportChange}
                                                           placeholder="Brief summary of the problem" maxLength={120} />
                                                </div>

                                                <div className="pp-field">
                                                    <label className="pp-label">Priority</label>
                                                    <select className="pp-input pp-select" name="priority"
                                                            value={reportData.priority} onChange={handleReportChange}>
                                                        <option value="low">🟢 Low — Minor inconvenience</option>
                                                        <option value="medium">🟡 Medium — Affecting my experience</option>
                                                        <option value="high">🔴 High — Blocking me completely</option>
                                                    </select>
                                                </div>

                                                <div className="pp-field pp-report-infobox">
                                                    <span>ℹ️</span>
                                                    <span>For urgent payment issues, also contact your bank directly while we investigate.</span>
                                                </div>

                                                <div className="pp-field pp-field-full">
                                                    <label className="pp-label">
                                                        Description
                                                        <span className="pp-report-char-count">{reportData.description.length} / 1000</span>
                                                    </label>
                                                    <textarea className="pp-input pp-textarea" name="description"
                                                              value={reportData.description} onChange={handleReportChange}
                                                              placeholder="Please describe the problem in detail. Include any relevant order numbers, dates, or steps to reproduce the issue."
                                                              rows={6} maxLength={1000} />
                                                    <span className="pp-hint">Minimum 20 characters. The more detail you provide, the faster we can help.</span>
                                                </div>
                                            </div>

                                            <div className="pp-actions">
                                                <button type="button" className="pp-btn-ghost"
                                                        onClick={() => setReportData({ category: '', subject: '', description: '', priority: 'medium' })}>
                                                    Clear
                                                </button>
                                                <button type="submit" className="pp-btn-danger" disabled={reportLoading}>
                                                    {reportLoading ? <span className="pp-btn-spinner" /> : '🚨'}
                                                    {reportLoading ? 'Submitting…' : 'Submit Report'}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Past reports */}
                                    {pastReports.length > 0 && (
                                        <div className="pp-past-reports">
                                            <h4 className="pp-past-reports-title">Your Previous Reports</h4>
                                            {reportsLoading ? (
                                                <div className="pp-loading" style={{ height: '80px' }}>
                                                    <div className="pp-spinner" />
                                                </div>
                                            ) : (
                                                <div className="pp-report-list">
                                                    {pastReports.map((report, idx) => {
                                                        const scfg = reportStatusConfig[report.status] || reportStatusConfig.open;
                                                        return (
                                                            <div key={report._id || idx} className="pp-report-item">
                                                                <div className="pp-report-item-left">
                                                                    <span className="pp-report-item-subject">{report.subject}</span>
                                                                    <span className="pp-report-item-meta">
                                                                        {report.category} · {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <span className="pp-report-status-badge" style={{ background: scfg.bg, color: scfg.color }}>
                                                                    {scfg.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;