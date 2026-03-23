import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateAuction.css';

const CreateAuction = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Select Gem, 2: Set Prices, 3: Set Times, 4: Review
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [gemstones, setGemstones] = useState([]);
    const [gemsLoading, setGemsLoading] = useState(true);

    const [selectedGem, setSelectedGem] = useState(null);
    const [gemSearch, setGemSearch] = useState('');

    const [auctionData, setAuctionData] = useState({
        gemId: '',
        startPrice: '',
        currentPrice: '',
        minIncrement: '',
        reservePrice: '',
        startTime: '',
        endTime: ''
    });

    // Fetch available gemstones
    useEffect(() => {
        const fetchGemstones = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/gemstones', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    // Filter gemstones that are not already in auctions
                    setGemstones(data.data);
                }
                setGemsLoading(false);
            } catch (err) {
                console.error('Failed to fetch gemstones:', err);
                setGemsLoading(false);
                setError('Failed to load gemstones');
            }
        };

        fetchGemstones();
    }, []);

    // Filter gemstones based on search
    const filteredGemstones = gemstones.filter(gem =>
        gem.title?.toLowerCase().includes(gemSearch.toLowerCase()) ||
        gem.type?.toLowerCase().includes(gemSearch.toLowerCase())
    );

    // Get gem image
    const getGemImage = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find(img => img.isPrimary);
            return primaryImage ? primaryImage.url : gem.images[0].url;
        }
        return 'https://via.placeholder.com/200x200?text=No+Image';
    };

    // Handle gem selection
    const handleSelectGem = (gem) => {
        setSelectedGem(gem);
        setAuctionData({
            ...auctionData,
            gemId: gem._id,
            currentPrice: gem.price || ''
        });
        setError('');
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuctionData({
            ...auctionData,
            [name]: value
        });
        setError('');
    };

    // Validate step 1
    const validateStep1 = () => {
        if (!selectedGem) {
            setError('Please select a gemstone');
            return false;
        }
        return true;
    };

    // Validate step 2
    const validateStep2 = () => {
        if (!auctionData.startPrice || !auctionData.currentPrice || !auctionData.minIncrement) {
            setError('Please fill in all required price fields');
            return false;
        }

        if (parseFloat(auctionData.startPrice) <= 0) {
            setError('Start price must be greater than 0');
            return false;
        }

        if (parseFloat(auctionData.currentPrice) < parseFloat(auctionData.startPrice)) {
            setError('Current price cannot be less than start price');
            return false;
        }

        if (parseFloat(auctionData.minIncrement) <= 0) {
            setError('Minimum increment must be greater than 0');
            return false;
        }

        if (auctionData.reservePrice && parseFloat(auctionData.reservePrice) < parseFloat(auctionData.startPrice)) {
            setError('Reserve price cannot be less than start price');
            return false;
        }

        return true;
    };

    // Validate step 3
    const validateStep3 = () => {
        if (!auctionData.startTime || !auctionData.endTime) {
            setError('Please set start and end times');
            return false;
        }

        const startTime = new Date(auctionData.startTime);
        const endTime = new Date(auctionData.endTime);
        const now = new Date();

        if (startTime < now) {
            setError('Start time must be in the future');
            return false;
        }

        if (endTime <= startTime) {
            setError('End time must be after start time');
            return false;
        }

        // Minimum auction duration: 1 hour
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        if (durationHours < 1) {
            setError('Auction must be at least 1 hour long');
            return false;
        }

        return true;
    };

    // Handle next step
    const handleNextStep = () => {
        let isValid = false;

        switch (step) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                break;
            default:
                isValid = true;
        }

        if (isValid) {
            setStep(step + 1);
            setError('');
        }
    };

    // Handle previous step
    const handlePrevStep = () => {
        setStep(step - 1);
        setError('');
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const submissionData = {
                gemId: auctionData.gemId,
                startPrice: parseFloat(auctionData.startPrice),
                currentPrice: parseFloat(auctionData.currentPrice),
                minIncrement: parseFloat(auctionData.minIncrement),
                reservePrice: auctionData.reservePrice ? parseFloat(auctionData.reservePrice) : null,
                startTime: auctionData.startTime,
                endTime: auctionData.endTime,
                status: 'scheduled'
            };

            const response = await fetch('http://localhost:5000/api/auctions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submissionData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create auction');
            }

            alert('Auction created successfully!');
            navigate('/auction');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-auction-page">
            {/* Header */}
            <header className="create-auction-header">
                <div className="create-auction-header-container">
                    <div className="create-auction-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <button onClick={onLogout} className="create-auction-logout-btn">Logout</button>
                </div>
            </header>

            <div className="create-auction-container">
                {/* Progress Steps */}
                <div className="create-auction-progress-steps">
                    <div className={`create-auction-progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="create-auction-step-circle">1</div>
                        <div className="create-auction-step-label">Select Gem</div>
                    </div>
                    <div className="create-auction-progress-line"></div>
                    <div className={`create-auction-progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="create-auction-step-circle">2</div>
                        <div className="create-auction-step-label">Set Prices</div>
                    </div>
                    <div className="create-auction-progress-line"></div>
                    <div className={`create-auction-progress-step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
                        <div className="create-auction-step-circle">3</div>
                        <div className="create-auction-step-label">Set Times</div>
                    </div>
                    <div className="create-auction-progress-line"></div>
                    <div className={`create-auction-progress-step ${step >= 4 ? 'active' : ''}`}>
                        <div className="create-auction-step-circle">4</div>
                        <div className="create-auction-step-label">Review</div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="create-auction-card">
                    <h1 className="create-auction-title">
                        {step === 1 && 'Select a Gemstone'}
                        {step === 2 && 'Set Auction Prices'}
                        {step === 3 && 'Set Auction Timeline'}
                        {step === 4 && 'Review Your Auction'}
                    </h1>

                    {error && (
                        <div className="create-auction-error">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="create-auction-form">
                        {/* Step 1: Select Gemstone */}
                        {step === 1 && (
                            <div className="create-auction-form-step">
                                <div className="create-auction-form-group">
                                    <label className="create-auction-form-label">Search Gemstone</label>
                                    <div className="create-auction-search-input">
                                        <span className="material-symbols-outlined">search</span>
                                        <input
                                            className="create-auction-form-input"
                                            type="text"
                                            placeholder="Search by name or type..."
                                            value={gemSearch}
                                            onChange={(e) => setGemSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {gemsLoading ? (
                                    <div className="create-auction-loading">
                                        <div className="spinner"></div>
                                        <p>Loading gemstones...</p>
                                    </div>
                                ) : filteredGemstones.length > 0 ? (
                                    <div className="create-auction-gems-grid">
                                        {filteredGemstones.map((gem) => (
                                            <div
                                                key={gem._id}
                                                className={`create-auction-gem-card ${selectedGem?._id === gem._id ? 'selected' : ''}`}
                                                onClick={() => handleSelectGem(gem)}
                                            >
                                                <div className="create-auction-gem-image">
                                                    <img src={getGemImage(gem)} alt={gem.title} />
                                                </div>
                                                <div className="create-auction-gem-info">
                                                    <h3>{gem.title}</h3>
                                                    <p className="create-auction-gem-type">{gem.type}</p>
                                                    <p className="create-auction-gem-details">
                                                        {gem.attributes?.carat || '0'} ct • {gem.attributes?.cut || 'Cut'}
                                                    </p>
                                                    <p className="create-auction-gem-price">
                                                        ${gem.price?.toLocaleString() || '0'}
                                                    </p>
                                                </div>
                                                {selectedGem?._id === gem._id && (
                                                    <div className="create-auction-selected-badge">
                                                        <span className="material-symbols-outlined">check_circle</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="create-auction-no-gems">
                                        <span className="material-symbols-outlined">diamond</span>
                                        <p>No gemstones available</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Set Prices */}
                        {step === 2 && (
                            <div className="create-auction-form-step">
                                {selectedGem && (
                                    <div className="create-auction-selected-gem-summary">
                                        <img src={getGemImage(selectedGem)} alt={selectedGem.title} />
                                        <div>
                                            <h3>{selectedGem.title}</h3>
                                            <p>{selectedGem.type} • {selectedGem.attributes?.carat} ct</p>
                                        </div>
                                    </div>
                                )}

                                <div className="create-auction-form-section">
                                    <h3 className="create-auction-form-section-title">Starting Price</h3>
                                    <div className="create-auction-form-group">
                                        <label className="create-auction-form-label">Start Price (USD) *</label>
                                        <div className="create-auction-currency-input">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                name="startPrice"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                value={auctionData.startPrice}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <span className="create-auction-form-hint">The initial bid amount for the auction</span>
                                    </div>
                                </div>

                                <div className="create-auction-form-section">
                                    <h3 className="create-auction-form-section-title">Current Bid</h3>
                                    <div className="create-auction-form-group">
                                        <label className="create-auction-form-label">Current Price (USD) *</label>
                                        <div className="create-auction-currency-input">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                name="currentPrice"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                value={auctionData.currentPrice}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <span className="create-auction-form-hint">Current highest bid (must be ≥ start price)</span>
                                    </div>
                                </div>

                                <div className="create-auction-form-section">
                                    <h3 className="create-auction-form-section-title">Bidding Rules</h3>
                                    <div className="create-auction-form-group">
                                        <label className="create-auction-form-label">Minimum Bid Increment (USD) *</label>
                                        <div className="create-auction-currency-input">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                name="minIncrement"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0.01"
                                                value={auctionData.minIncrement}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <span className="create-auction-form-hint">Minimum amount each bid must increase by</span>
                                    </div>

                                    <div className="create-auction-form-group">
                                        <label className="create-auction-form-label">Reserve Price (USD) - Optional</label>
                                        <div className="create-auction-currency-input">
                                            <span>$</span>
                                            <input
                                                type="number"
                                                name="reservePrice"
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                value={auctionData.reservePrice}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <span className="create-auction-form-hint">Minimum price you're willing to accept (if not met, auction can be cancelled)</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Set Times */}
                        {step === 3 && (
                            <div className="create-auction-form-step">
                                <div className="create-auction-form-section">
                                    <h3 className="create-auction-form-section-title">Auction Timeline</h3>

                                    <div className="create-auction-form-row">
                                        <div className="create-auction-form-group">
                                            <label className="create-auction-form-label">Start Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                name="startTime"
                                                className="create-auction-form-input"
                                                value={auctionData.startTime}
                                                onChange={handleChange}
                                                required
                                            />
                                            <span className="create-auction-form-hint">When the auction will begin</span>
                                        </div>

                                        <div className="create-auction-form-group">
                                            <label className="create-auction-form-label">End Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                name="endTime"
                                                className="create-auction-form-input"
                                                value={auctionData.endTime}
                                                onChange={handleChange}
                                                required
                                            />
                                            <span className="create-auction-form-hint">When the auction will end</span>
                                        </div>
                                    </div>

                                    {auctionData.startTime && auctionData.endTime && (
                                        <div className="create-auction-duration-info">
                                            <span className="material-symbols-outlined">info</span>
                                            <div>
                                                <strong>Auction Duration:</strong>
                                                <p>
                                                    {Math.floor((new Date(auctionData.endTime) - new Date(auctionData.startTime)) / (1000 * 60 * 60))} hours
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {step === 4 && (
                            <div className="create-auction-form-step">
                                <div className="create-auction-review-section">
                                    <h3 className="create-auction-review-title">Gemstone</h3>
                                    <div className="create-auction-review-gem">
                                        <img src={getGemImage(selectedGem)} alt={selectedGem?.title} />
                                        <div>
                                            <h4>{selectedGem?.title}</h4>
                                            <p>{selectedGem?.type} • {selectedGem?.attributes?.carat} ct</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="create-auction-review-section">
                                    <h3 className="create-auction-review-title">Pricing Details</h3>
                                    <div className="create-auction-review-item">
                                        <span>Start Price:</span>
                                        <span>${parseFloat(auctionData.startPrice).toLocaleString()}</span>
                                    </div>
                                    <div className="create-auction-review-item">
                                        <span>Current Price:</span>
                                        <span>${parseFloat(auctionData.currentPrice).toLocaleString()}</span>
                                    </div>
                                    <div className="create-auction-review-item">
                                        <span>Minimum Increment:</span>
                                        <span>${parseFloat(auctionData.minIncrement).toLocaleString()}</span>
                                    </div>
                                    {auctionData.reservePrice && (
                                        <div className="create-auction-review-item">
                                            <span>Reserve Price:</span>
                                            <span>${parseFloat(auctionData.reservePrice).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="create-auction-review-section">
                                    <h3 className="create-auction-review-title">Timeline</h3>
                                    <div className="create-auction-review-item">
                                        <span>Start:</span>
                                        <span>{new Date(auctionData.startTime).toLocaleString()}</span>
                                    </div>
                                    <div className="create-auction-review-item">
                                        <span>End:</span>
                                        <span>{new Date(auctionData.endTime).toLocaleString()}</span>
                                    </div>
                                    <div className="create-auction-review-item">
                                        <span>Duration:</span>
                                        <span>
                                            {Math.floor((new Date(auctionData.endTime) - new Date(auctionData.startTime)) / (1000 * 60 * 60))} hours
                                        </span>
                                    </div>
                                </div>

                                <div className="create-auction-info-box">
                                    <span className="material-symbols-outlined">info</span>
                                    <div>
                                        <strong>Before you publish:</strong>
                                        <ul>
                                            <li>Review all details carefully</li>
                                            <li>Once published, auction cannot be modified</li>
                                            <li>Auction will start at the scheduled time</li>
                                            <li>Bids cannot be canceled</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="create-auction-form-actions">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handlePrevStep}
                                    className="create-auction-btn-secondary"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Previous
                                </button>
                            )}

                            <div className="create-auction-spacer"></div>

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="create-auction-btn-primary"
                                >
                                    Next
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="create-auction-btn-submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Publishing...' : 'Publish Auction'}
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

export default CreateAuction;