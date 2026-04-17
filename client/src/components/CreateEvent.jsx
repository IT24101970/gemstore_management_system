import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEvent.css';

const CreateEvent = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'exhibition',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        location: '',
        address: '',
        capacity: '',
        contactEmail: 'ceylongems@gmail.com',
        contactPhone: '0771234567',
        hasDiscount: false,
        discount: '',
        discountDescription: '',
        image: null
    });

    const validateStep1 = () => {
        if (!formData.title.trim()) {
            setError('Event title is required');
            return false;
        }

        if (formData.title.trim().length < 10) {
            setError('Event title must be at least 10 characters');
            return false;
        }

        if (!formData.description.trim()) {
            setError('Description is required');
            return false;
        }

        if (formData.description.trim().length < 50) {
            setError('Description must be at least 50 characters');
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (!formData.location || !formData.address || !formData.startDate || !formData.endDate) {
            setError('Please fill in all required fields');
            return false;
        }

        if (!formData.capacity) {
            setError('Capacity is required');
            return false;
        }

        if (!/^\d+$/.test(formData.capacity)) {
            setError('Capacity must be a number');
            return false;
        }

        if (Number(formData.capacity) <= 50) {
            setError('Capacity must be greater than 50');
            return false;
        }

        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (start < todayDate) {
            setError('Start date must be today or in the future');
            return false;
        }

        if (end < start) {
            setError('End date must be after start date');
            return false;
        }

        const fixedEmail = 'ceylongems@gmail.com';
        const fixedPhone = '0771234567';

        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(fixedEmail)) {
            setError('Invalid contact email');
            return false;
        }

        if (!/^0\d{9}$/.test(fixedPhone)) {
            setError('Contact phone must be 10 digits');
            return false;
        }

        if (!formData.startTime || !formData.endTime) {
            setError('Start time and end time are required');
            return false;
        }

        if (
            formData.startDate === formData.endDate &&
            formData.endTime <= formData.startTime
        ) {
            setError('End time must be later than start time');
            return false;
        }

        return true;
    };

    const validateStep3 = () => {
        if (!formData.image) {
            setError('Please upload an event image');
            return false;
        }

        if (formData.hasDiscount) {
            const discountValue = Number(formData.discount);

            if (!formData.discount || discountValue <= 0 || discountValue > 100) {
                setError('Please enter a valid discount percentage (1-100)');
                return false;
            }
        }

        return true;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            const updated = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            if (name === 'startDate' && prev.endDate && prev.endDate < value) {
                updated.endDate = value;
            }

            return updated;
        });

        setError('');
    };

    // ✅ ADD IMAGE PREVIEW
    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Set image in form data
            setFormData((prev) => ({
                ...prev,
                image: file
            }));
        }
    };

    // ✅ REMOVE IMAGE PREVIEW
    const handleRemoveImage = () => {
        setImagePreview(null);
        setFormData((prev) => ({
            ...prev,
            image: null
        }));
    };

    const handleNext = () => {
        let isValid = false;

        if (step === 1) {
            isValid = validateStep1();
        } else if (step === 2) {
            isValid = validateStep2();
        } else {
            isValid = true;
        }

        if (isValid) {
            setStep((prev) => prev + 1);
            setError('');
        }
    };

    const handlePrevious = () => {
        setError('');
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!validateStep1() || !validateStep2() || !validateStep3()) {
                setLoading(false);
                return;
            }

            const submitData = new FormData();

            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('type', formData.type);
            submitData.append('startDate', formData.startDate);
            submitData.append('endDate', formData.endDate);
            submitData.append('startTime', formData.startTime);
            submitData.append('endTime', formData.endTime);
            submitData.append('location', formData.location);
            submitData.append('address', formData.address);
            submitData.append('capacity', formData.capacity ? Number(formData.capacity) : '');
            submitData.append('contactEmail', 'ceylongems@gmail.com');
            submitData.append('contactPhone', '0771234567');
            submitData.append('hasDiscount', formData.hasDiscount);
            submitData.append('discount', formData.hasDiscount ? Number(formData.discount) : 0);
            submitData.append('discountDescription', formData.discountDescription);
            submitData.append('status', 'upcoming');
            submitData.append('organizerId', user?.id || '');

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                body: submitData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event');
            }

            setSuccess('Event created successfully!');
            setSubmitted(true);
        } catch (err) {
            console.error('Create event error:', err);
            setError(err.message || 'Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="create-event-page">
                <header className="create-event-header">
                    <div className="create-event-header-container">
                        <div
                            className="create-event-logo"
                            onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}
                        >
                            <span className="material-symbols-outlined">diamond</span>
                            <span>Ceylon Gems</span>
                        </div>

                        <button onClick={onLogout} className="create-event-logout-btn">
                            Logout
                        </button>
                    </div>
                </header>

                <div className="create-event-success-page">
                    <div className="create-event-success-card">
                        <span className="material-symbols-outlined success-icon">check_circle</span>
                        <h1>Event Created Successfully</h1>
                        <p>Your event has been added successfully to the system.</p>

                        <div className="create-event-success-actions">
                            <button
                                className="create-event-btn-primary"
                                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}
                            >
                                Go to Home Page
                            </button>

                            <button
                                className="create-event-btn-secondary"
                                onClick={() =>
                                    navigate(user?.role === 'admin' ? '/admin/event-listing' : '/eventListing')
                                }
                            >
                                View Events
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="create-event-page">
            <header className="create-event-header">
                <div className="create-event-header-container">
                    <div
                        className="create-event-logo"
                        onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}
                    >
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    <button onClick={onLogout} className="create-event-logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <div className="create-event-container">
                <div className="create-event-card">
                    <div className="create-event-card-header">
                        <h1>Create New Event</h1>
                        <p>Add a gemstone event, exhibition, fair, or discount promotion</p>
                    </div>

                    <div className="create-event-progress">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                        <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
                    </div>

                    {error && <div className="create-event-error">{error}</div>}
                    {success && <div className="create-event-success">{success}</div>}

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="create-event-step">
                                <h2>Basic Information</h2>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="create-event-form-input"
                                        placeholder="Enter event title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="character-count">
                                        {formData.title.trim().length}/10 minimum characters
                                    </p>
                                </div>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Description *</label>
                                    <textarea
                                        name="description"
                                        className="create-event-form-textarea"
                                        placeholder="Enter event description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="5"
                                        required
                                    />
                                    <p className="character-count">
                                        {formData.description.trim().length}/50 minimum characters
                                    </p>
                                </div>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Type *</label>
                                    <select
                                        name="type"
                                        className="create-event-form-select"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        <option value="exhibition">Exhibition</option>
                                        <option value="trade_show">Discount Sale</option>
                                        <option value="auction">Auction Event</option>
                                        <option value="workshop">Workshop</option>
                                        <option value="seminar">Conference</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="create-event-step">
                                <h2>Event Details</h2>

                                <div className="create-event-form-row">
                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">Location/City *</label>
                                        <select
                                            name="location"
                                            className="create-event-form-select"
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Location</option>
                                            <option value="Colombo">Colombo</option>
                                            <option value="Ratnapura">Ratnapura</option>
                                            <option value="Kandy">Kandy</option>
                                            <option value="Galle">Galle</option>
                                            <option value="Jaffna">Jaffna</option>
                                            <option value="Trincomalee">Trincomalee</option>
                                            <option value="Nuwara Eliya">Nuwara Eliya</option>
                                            <option value="Negombo">Negombo</option>
                                        </select>
                                    </div>

                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">Venue Address</label>
                                        <input
                                            type="text"
                                            name="address"
                                            className="create-event-form-input"
                                            placeholder="e.g., BMICH, Bauddhaloka Mawatha"
                                            value={formData.address}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="create-event-form-row">
                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">Start Date *</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            className="create-event-form-input"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">Start Time</label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            className="create-event-form-input"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="create-event-form-row">
                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">End Date *</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            className="create-event-form-input"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>

                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">End Time</label>
                                        <input
                                            type="time"
                                            name="endTime"
                                            className="create-event-form-input"
                                            value={formData.endTime}
                                            onChange={handleChange}
                                            min={
                                                formData.startDate === formData.endDate
                                                    ? formData.startTime
                                                    : undefined
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Expected Capacity (Optional)</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        className="create-event-form-input"
                                        placeholder="e.g., 500"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        min="51"
                                        required
                                    />
                                </div>

                                <div className="create-event-form-section">
                                    <h3 className="create-event-form-section-title">Contact Information</h3>

                                    <div className="create-event-form-row">
                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Contact Email *</label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                className="create-event-form-input create-event-form-input-readonly"
                                                value="ceylongems@gmail.com"
                                                readOnly
                                            />
                                        </div>

                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Contact Phone</label>
                                            <input
                                                type="text"
                                                name="contactPhone"
                                                className="create-event-form-input create-event-form-input-readonly"
                                                value="0771234567"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="create-event-step">
                                <h2>Discount & Media</h2>

                                <div className="create-event-checkbox-row">
                                    <input
                                        type="checkbox"
                                        id="hasDiscount"
                                        name="hasDiscount"
                                        checked={formData.hasDiscount}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="hasDiscount">Enable event discount</label>
                                </div>

                                {formData.hasDiscount && (
                                    <>
                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Discount Percentage (%)</label>
                                            <input
                                                type="number"
                                                name="discount"
                                                className="create-event-form-input"
                                                placeholder="Enter discount percentage"
                                                value={formData.discount}
                                                onChange={handleChange}
                                                min="0"
                                                max="100"
                                            />
                                        </div>

                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Discount Description</label>
                                            <input
                                                type="text"
                                                name="discountDescription"
                                                className="create-event-form-input"
                                                placeholder="e.g., Special New Year Discount"
                                                value={formData.discountDescription}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ✅ IMAGE UPLOAD WITH PREVIEW */}
                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Image *</label>

                                    {imagePreview ? (
                                        <div style={{
                                            position: 'relative',
                                            marginBottom: '15px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '2px solid #e5e7eb'
                                        }}>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
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
                                    ) : (
                                        <input
                                            type="file"
                                            className="create-event-form-input"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            required
                                        />
                                    )}
                                    <small className="create-event-help-text">
                                        {imagePreview ? '✅ Image selected' : 'Upload one event image (JPEG, PNG, WebP)'}
                                    </small>
                                </div>
                            </div>
                        )}

                        <div className="create-event-actions">
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="create-event-btn-secondary"
                                    onClick={handlePrevious}
                                >
                                    Previous
                                </button>
                            )}

                            {step < 3 ? (
                                <button
                                    type="button"
                                    className="create-event-btn-primary"
                                    onClick={handleNext}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="create-event-btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Event'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;