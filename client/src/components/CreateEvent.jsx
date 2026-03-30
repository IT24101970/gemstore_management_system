import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEvent.css';

const CreateEvent = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Exhibition',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        capacity: '',
        contactEmail: '',
        contactPhone: '',
        images: [],
        hasDiscount: false,
        discount: '',
        discountDescription: ''
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        setError('');
        setSuccess('');
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);

        setImageFiles((prev) => [...prev, ...files]);

        const newImages = files.map((file, index) => ({
            url: URL.createObjectURL(file),
            isPrimary: formData.images.length === 0 && index === 0,
            uploadedAt: new Date()
        }));

        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...newImages]
        }));
    };

    const removeImage = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        const newImageFiles = imageFiles.filter((_, i) => i !== index);

        if (formData.images[index]?.isPrimary && newImages.length > 0) {
            newImages[0].isPrimary = true;
            setPrimaryImageIndex(0);
        }

        setFormData((prev) => ({
            ...prev,
            images: newImages
        }));

        setImageFiles(newImageFiles);
    };

    const setPrimaryImage = (index) => {
        const updatedImages = formData.images.map((img, i) => ({
            ...img,
            isPrimary: i === index
        }));

        setFormData((prev) => ({
            ...prev,
            images: updatedImages
        }));

        setPrimaryImageIndex(index);
    };

    const validateStep1 = () => {
        if (!formData.title || !formData.description || !formData.type) {
            setError('Please fill in all required fields');
            return false;
        }

        if (formData.title.length < 10) {
            setError('Title must be at least 10 characters');
            return false;
        }

        if (formData.description.length < 50) {
            setError('Description must be at least 50 characters');
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (!formData.location || !formData.startDate || !formData.endDate || !formData.contactEmail) {
            setError('Please fill in all required fields');
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (start < today) {
            setError('Start date must be today or in the future');
            return false;
        }

        if (end < start) {
            setError('End date must be after start date');
            return false;
        }

        return true;
    };

    const validateStep3 = () => {
        if (formData.images.length === 0) {
            setError('Please upload at least one image');
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

    const nextStep = () => {
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

    const prevStep = () => {
        setStep((prev) => prev - 1);
        setError('');
        setSuccess('');
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

            const eventData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                startDate: formData.startDate,
                endDate: formData.endDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                location: formData.location,
                address: formData.address,
                capacity: formData.capacity ? Number(formData.capacity) : undefined,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone,
                hasDiscount: formData.hasDiscount,
                discount: formData.hasDiscount ? Number(formData.discount) : 0,
                discountDescription: formData.discountDescription,
                status: 'upcoming',
                organizerId: user?.id,
                images: []
            };

            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
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
                        <div className="create-event-logo" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}>
                            <span className="material-symbols-outlined">diamond</span>
                            <span>Ceylon Gems</span>
                        </div>
                        <button onClick={onLogout} className="create-event-logout-btn">Logout</button>
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
                                onClick={() => navigate(user?.role === 'admin' ? '/admin/event-listing' : '/eventListing')}
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
                    <div className="create-event-logo" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <button onClick={onLogout} className="create-event-logout-btn">Logout</button>
                </div>
            </header>

            <div className="create-event-container">
                <div className="create-event-progress-steps">
                    <div className={`create-event-progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="create-event-step-circle">1</div>
                        <div className="create-event-step-label">Basic Info</div>
                    </div>

                    <div className="create-event-progress-line"></div>

                    <div className={`create-event-progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="create-event-step-circle">2</div>
                        <div className="create-event-step-label">Details</div>
                    </div>

                    <div className="create-event-progress-line"></div>

                    <div className={`create-event-progress-step ${step >= 3 ? 'active' : ''}`}>
                        <div className="create-event-step-circle">3</div>
                        <div className="create-event-step-label">Images & Discount</div>
                    </div>
                </div>

                <div className="create-event-card">
                    <h1 className="create-event-title">
                        {step === 1 && 'Basic Event Information'}
                        {step === 2 && 'Event Details'}
                        {step === 3 && 'Images & Discount Settings'}
                    </h1>

                    {error && (
                        <div className="create-event-error">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="create-event-success">
                            <span className="material-symbols-outlined">check_circle</span>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="create-event-form">
                        {step === 1 && (
                            <div className="create-event-form-step">
                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="create-event-form-input"
                                        placeholder="e.g., Ratnapura Gem & Jewellery Exhibition 2024"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="create-event-form-hint">{formData.title.length}/100 characters</span>
                                </div>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Type *</label>
                                    <select
                                        name="type"
                                        className="create-event-form-select"
                                        value={formData.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Exhibition">Exhibition</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Discount Sale">Discount Sale</option>
                                        <option value="Auction Event">Auction Event</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Conference">Conference</option>
                                    </select>
                                </div>

                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Description *</label>
                                    <textarea
                                        name="description"
                                        className="create-event-form-textarea"
                                        rows="6"
                                        placeholder="Describe your event in detail... Include information about what attendees can expect, special attractions, etc."
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                    <span className="create-event-form-hint">
                                        {formData.description.length}/1000 characters (minimum 50)
                                    </span>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="create-event-form-step">
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
                                            <option value="Matara">Matara</option>
                                            <option value="Jaffna">Jaffna</option>
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
                                        />
                                    </div>
                                </div>

                                <div className="create-event-form-row">
                                    <div className="create-event-form-group">
                                        <label className="create-event-form-label">Expected Capacity (Optional)</label>
                                        <input
                                            type="number"
                                            name="capacity"
                                            className="create-event-form-input"
                                            placeholder="e.g., 500"
                                            min="0"
                                            value={formData.capacity}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="create-event-form-section">
                                    <h3 className="create-event-form-section-title">Contact Information</h3>

                                    <div className="create-event-form-row">
                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Contact Email *</label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                className="create-event-form-input"
                                                placeholder="event@example.com"
                                                value={formData.contactEmail}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="create-event-form-group">
                                            <label className="create-event-form-label">Contact Phone</label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                className="create-event-form-input"
                                                placeholder="+94 77 123 4567"
                                                value={formData.contactPhone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="create-event-form-step">
                                <div className="create-event-form-group">
                                    <label className="create-event-form-label">Event Images * (Minimum 1, Maximum 10)</label>

                                    <div className="create-event-image-upload-area">
                                        <input
                                            type="file"
                                            id="event-images"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="create-event-file-input"
                                            disabled={formData.images.length >= 10}
                                        />
                                        <label
                                            htmlFor="event-images"
                                            className={`create-event-file-upload-label ${formData.images.length >= 10 ? 'disabled' : ''}`}
                                        >
                                            <span className="material-symbols-outlined">add_photo_alternate</span>
                                            <span>Click to upload images</span>
                                            <span className="create-event-file-hint">JPG, PNG (Max 5MB each)</span>
                                        </label>
                                    </div>

                                    {formData.images.length > 0 && (
                                        <div className="create-event-image-preview-grid">
                                            {formData.images.map((image, index) => (
                                                <div key={index} className="create-event-image-preview-item">
                                                    <img src={image.url} alt={`Preview ${index + 1}`} />
                                                    <div className="create-event-image-preview-overlay">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPrimaryImage(index)}
                                                            className={`create-event-primary-btn ${image.isPrimary ? 'active' : ''}`}
                                                        >
                                                            <span className="material-symbols-outlined">
                                                                {image.isPrimary ? 'star' : 'star_border'}
                                                            </span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="create-event-remove-btn"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                    {image.isPrimary && (
                                                        <div className="create-event-primary-badge">Primary</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="create-event-form-section discount-section">
                                    <h3 className="create-event-form-section-title">Discount Settings</h3>

                                    <div className="create-event-form-checkbox-group">
                                        <label className="create-event-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="hasDiscount"
                                                checked={formData.hasDiscount}
                                                onChange={handleChange}
                                            />
                                            <span>Apply automatic discount to gems during this event</span>
                                        </label>
                                    </div>

                                    {formData.hasDiscount && (
                                        <>
                                            <div className="create-event-form-group">
                                                <label className="create-event-form-label">Discount Percentage *</label>
                                                <div className="create-event-discount-input-wrapper">
                                                    <input
                                                        type="number"
                                                        name="discount"
                                                        className="create-event-form-input discount-input"
                                                        placeholder="10"
                                                        min="1"
                                                        max="100"
                                                        value={formData.discount}
                                                        onChange={handleChange}
                                                        required={formData.hasDiscount}
                                                    />
                                                    <span className="discount-symbol">%</span>
                                                </div>
                                                <span className="create-event-form-hint">
                                                    Customers will automatically receive this discount on all gems during the event period
                                                </span>
                                            </div>

                                            <div className="create-event-form-group">
                                                <label className="create-event-form-label">Discount Description (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="discountDescription"
                                                    className="create-event-form-input"
                                                    placeholder="e.g., Special Exhibition Discount, Early Bird Offer"
                                                    value={formData.discountDescription}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="create-event-info-box">
                                                <span className="material-symbols-outlined">info</span>
                                                <div>
                                                    <strong>How it works:</strong>
                                                    <ul>
                                                        <li>The discount will be automatically applied to all gems purchased during the event dates</li>
                                                        <li>Discount will be visible on product pages and during checkout</li>
                                                        <li>Sellers will receive the discounted amount minus platform fees</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="create-event-form-actions">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="create-event-btn-secondary"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Previous
                                </button>
                            )}

                            <div className="create-event-spacer"></div>

                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="create-event-btn-primary"
                                >
                                    Next
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="create-event-btn-submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Create Event'}
                                    <span className="material-symbols-outlined">check_circle</span>
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