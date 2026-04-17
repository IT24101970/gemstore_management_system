import React, { useState, useEffect } from 'react';
import './ProfileModal.css';

const ProfileModal = ({ user, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [profile, setProfile] = useState(null);

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

    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Fetch full profile from backend
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
                if (onUpdate) onUpdate(data.data);
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
        // Reset form to current profile data
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

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: 'person' },
        { id: 'address', label: 'Address', icon: 'home' },
        { id: 'security', label: 'Security', icon: 'lock' },
        ...(profile?.role === 'seller' || profile?.becomeSeller
            ? [{ id: 'business', label: 'Business', icon: 'store' }]
            : [])
    ];

    return (
        <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="pm-modal">
                {/* Header */}
                <div className="pm-header">
                    <div className="pm-header-left">
                        <div className="pm-avatar">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <div>
                            <h2 className="pm-username">{profile?.name || user?.name || 'My Profile'}</h2>
                            <span className="pm-role-badge">{profile?.role || 'buyer'}</span>
                        </div>
                    </div>
                    <button className="pm-close-btn" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="pm-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`pm-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); setEditMode(false); }}
                        >
                            <span className="material-symbols-outlined">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="pm-body">
                    {fetchLoading ? (
                        <div className="pm-loading">
                            <span className="material-symbols-outlined spin">progress_activity</span>
                            Loading profile...
                        </div>
                    ) : (
                        <>
                            {/* Message */}
                            {message.text && (
                                <div className={`pm-message pm-message-${message.type}`}>
                                    <span className="material-symbols-outlined">
                                        {message.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    {message.text}
                                </div>
                            )}

                            {/* Personal Info Tab */}
                            {activeTab === 'personal' && (
                                <div className="pm-section">
                                    <div className="pm-section-header">
                                        <h3>Personal Information</h3>
                                        {!editMode && (
                                            <button className="pm-edit-btn" onClick={() => setEditMode(true)}>
                                                <span className="material-symbols-outlined">edit</span>
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className="pm-fields">
                                        <div className="pm-field">
                                            <label>Full Name</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.name || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>Email Address</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.email || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>Phone Number</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="tel"
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber}
                                                    onChange={handleChange}
                                                    placeholder="+94 77 123 4567"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.phoneNumber || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field pm-field-readonly">
                                            <label>Account Role</label>
                                            <span className="pm-value">{profile?.role || 'buyer'}</span>
                                        </div>

                                        <div className="pm-field pm-field-readonly">
                                            <label>Member Since</label>
                                            <span className="pm-value">
                                                {profile?.createdAt
                                                    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {editMode && (
                                        <div className="pm-actions">
                                            <button className="pm-btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pm-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Address Tab */}
                            {activeTab === 'address' && (
                                <div className="pm-section">
                                    <div className="pm-section-header">
                                        <h3>Shipping Address</h3>
                                        {!editMode && (
                                            <button className="pm-edit-btn" onClick={() => setEditMode(true)}>
                                                <span className="material-symbols-outlined">edit</span>
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className="pm-fields">
                                        <div className="pm-field pm-field-full">
                                            <label>Street Address</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="shippingAddress.street"
                                                    value={formData.shippingAddress.street}
                                                    onChange={handleChange}
                                                    placeholder="123 Main Street"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.shippingAddress?.street || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>City</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="shippingAddress.city"
                                                    value={formData.shippingAddress.city}
                                                    onChange={handleChange}
                                                    placeholder="Colombo"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.shippingAddress?.city || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>State / Province</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="shippingAddress.state"
                                                    value={formData.shippingAddress.state}
                                                    onChange={handleChange}
                                                    placeholder="Western"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.shippingAddress?.state || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>Postal Code</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="shippingAddress.postalCode"
                                                    value={formData.shippingAddress.postalCode}
                                                    onChange={handleChange}
                                                    placeholder="00100"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.shippingAddress?.postalCode || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field">
                                            <label>Country</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="shippingAddress.country"
                                                    value={formData.shippingAddress.country}
                                                    onChange={handleChange}
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.shippingAddress?.country || 'Sri Lanka'}</span>
                                            )}
                                        </div>
                                    </div>

                                    {editMode && (
                                        <div className="pm-actions">
                                            <button className="pm-btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pm-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="pm-section">
                                    <div className="pm-section-header">
                                        <h3>Change Password</h3>
                                    </div>
                                    <form onSubmit={handleChangePassword}>
                                        <div className="pm-fields">
                                            <div className="pm-field pm-field-full">
                                                <label>Current Password</label>
                                                <div className="pm-input-wrapper">
                                                    <input
                                                        className="pm-input"
                                                        type={showPasswords.current ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pm-eye-btn"
                                                        onClick={() => toggleShowPassword('current')}
                                                        tabIndex={-1}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {showPasswords.current ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="pm-field">
                                                <label>New Password</label>
                                                <div className="pm-input-wrapper">
                                                    <input
                                                        className="pm-input"
                                                        type={showPasswords.newPw ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pm-eye-btn"
                                                        onClick={() => toggleShowPassword('newPw')}
                                                        tabIndex={-1}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {showPasswords.newPw ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                                <span className="pm-hint">Minimum 6 characters</span>
                                            </div>
                                            <div className="pm-field">
                                                <label>Confirm New Password</label>
                                                <div className="pm-input-wrapper">
                                                    <input
                                                        className="pm-input"
                                                        type={showPasswords.confirm ? 'text' : 'password'}
                                                        placeholder="••••••••"
                                                        value={passwordData.confirmPassword}
                                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="pm-eye-btn"
                                                        onClick={() => toggleShowPassword('confirm')}
                                                        tabIndex={-1}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {showPasswords.confirm ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pm-actions">
                                            <button type="submit" className="pm-btn-primary" disabled={loading}>
                                                {loading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Business Tab */}
                            {activeTab === 'business' && (
                                <div className="pm-section">
                                    <div className="pm-section-header">
                                        <h3>Business Information</h3>
                                        {!editMode && (
                                            <button className="pm-edit-btn" onClick={() => setEditMode(true)}>
                                                <span className="material-symbols-outlined">edit</span>
                                                Edit
                                            </button>
                                        )}
                                    </div>

                                    <div className="pm-fields">
                                        <div className="pm-field pm-field-full">
                                            <label>Business Name</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="businessName"
                                                    value={formData.businessName}
                                                    onChange={handleChange}
                                                    placeholder="GemLanka Trading Co."
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.businessName || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field pm-field-full">
                                            <label>Business Registration Number</label>
                                            {editMode ? (
                                                <input
                                                    className="pm-input"
                                                    type="text"
                                                    name="businessRegistration"
                                                    value={formData.businessRegistration}
                                                    onChange={handleChange}
                                                    placeholder="PV123456"
                                                />
                                            ) : (
                                                <span className="pm-value">{profile?.businessRegistration || '—'}</span>
                                            )}
                                        </div>

                                        <div className="pm-field pm-field-full pm-field-readonly">
                                            <label>Verification Status</label>
                                            <span className={`pm-status-badge pm-status-${profile?.sellerStatus || 'pending'}`}>
                                                <span className="material-symbols-outlined">
                                                    {profile?.sellerStatus === 'approved' ? 'verified' :
                                                        profile?.sellerStatus === 'rejected' ? 'cancel' : 'schedule'}
                                                </span>
                                                {profile?.sellerStatus || 'pending'}
                                            </span>
                                        </div>
                                    </div>

                                    {editMode && (
                                        <div className="pm-actions">
                                            <button className="pm-btn-secondary" onClick={handleCancelEdit}>Cancel</button>
                                            <button className="pm-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;