import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

const Register = ({ onRegisterSuccess }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        shippingAddress: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Sri Lanka'
        },
        becomeSeller: false,
        businessName: '',
        businessRegistration: '',
        verificationDocuments: []
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [documentFiles, setDocumentFiles] = useState([]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('shippingAddress.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                shippingAddress: {
                    ...formData.shippingAddress,
                    [field]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
        setError('');
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setDocumentFiles(files);

        const docs = files.map(file => ({
            type: 'businessRegistration',
            url: `https://placeholder.com/docs/${file.name}`,
            uploadedAt: new Date()
        }));

        setFormData({
            ...formData,
            verificationDocuments: docs
        });
    };

    const validateStep1 = () => {
        if (!formData.name || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (!formData.phoneNumber) {
            setError('Phone number is required');
            return false;
        }

        if (!formData.shippingAddress.street || !formData.shippingAddress.city) {
            setError('Please provide your shipping address');
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (formData.verificationDocuments.length === 0) {
            setError('Please upload at least one verification document');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep1()) return;

        if (formData.becomeSeller) {
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (step === 2 && !validateStep2()) return;

        setLoading(true);
        setError('');

        try {
            const data = await authAPI.register(formData);

            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success message
            alert(data.message);

            // Call the success handler
            onRegisterSuccess(data.user);

            // Redirect to home
            navigate('/home');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <span className="material-symbols-outlined">diamond</span>
                    <span className="auth-logo-text">Ceylon Gems</span>
                </div>

                <div className="auth-card">
                    {step === 1 ? (
                        <>
                            <h1 className="auth-title">Create Account</h1>
                            <p className="auth-subtitle">Join the premier gemstone marketplace</p>

                            {error && (
                                <div className="auth-error">
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="auth-form">
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        className="form-input"
                                        placeholder="+94 77 123 4567"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="form-hint">Minimum 6 characters</span>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm Password *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Shipping Address *</h3>

                                    <div className="form-group">
                                        <label className="form-label">Street Address</label>
                                        <input
                                            type="text"
                                            name="shippingAddress.street"
                                            className="form-input"
                                            placeholder="123 Main Street"
                                            value={formData.shippingAddress.street}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input
                                                type="text"
                                                name="shippingAddress.city"
                                                className="form-input"
                                                placeholder="Colombo"
                                                value={formData.shippingAddress.city}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">State/Province</label>
                                            <input
                                                type="text"
                                                name="shippingAddress.state"
                                                className="form-input"
                                                placeholder="Western"
                                                value={formData.shippingAddress.state}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Postal Code</label>
                                            <input
                                                type="text"
                                                name="shippingAddress.postalCode"
                                                className="form-input"
                                                placeholder="00100"
                                                value={formData.shippingAddress.postalCode}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Country</label>
                                            <input
                                                type="text"
                                                name="shippingAddress.country"
                                                className="form-input"
                                                value={formData.shippingAddress.country}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="becomeSeller"
                                            checked={formData.becomeSeller}
                                            onChange={handleChange}
                                        />
                                        <span>I want to sell gemstones (requires verification)</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-button"
                                    disabled={loading}
                                >
                                    {formData.becomeSeller ? 'Continue to Seller Info' : 'Create Account'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="step-header">
                                <button onClick={() => setStep(1)} className="back-button">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div>
                                    <h1 className="auth-title">Seller Information</h1>
                                    <p className="auth-subtitle">Additional details for verification</p>
                                </div>
                            </div>

                            {error && (
                                <div className="auth-error">
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="form-group">
                                    <label className="form-label">Business Name (Optional)</label>
                                    <input
                                        type="text"
                                        name="businessName"
                                        className="form-input"
                                        placeholder="e.g., GemLanka Trading Co."
                                        value={formData.businessName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Business Registration Number (Optional)</label>
                                    <input
                                        type="text"
                                        name="businessRegistration"
                                        className="form-input"
                                        placeholder="e.g., PV123456"
                                        value={formData.businessRegistration}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Verification Documents *</label>
                                    <div className="file-upload-area">
                                        <input
                                            type="file"
                                            id="documents"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleFileUpload}
                                            className="file-input"
                                        />
                                        <label htmlFor="documents" className="file-upload-label">
                                            <span className="material-symbols-outlined">cloud_upload</span>
                                            <span>Upload ID, Business Registration, or other verification documents</span>
                                            <span className="file-hint">PDF, JPG, PNG (Max 5MB each)</span>
                                        </label>
                                    </div>
                                    {documentFiles.length > 0 && (
                                        <div className="file-list">
                                            {documentFiles.map((file, index) => (
                                                <div key={index} className="file-item">
                                                    <span className="material-symbols-outlined">description</span>
                                                    <span>{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="info-box">
                                    <span className="material-symbols-outlined">info</span>
                                    <p>Your seller account will be reviewed by our admin team. You'll receive an email once approved.</p>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit for Verification'}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="auth-footer">
                        <p>Already have an account?
                            <Link to="/login" className="auth-link-button">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;