import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EventDetails.css';

const EventDetails = ({ user, onLogout }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true);

                const response = await fetch(`http://localhost:5000/api/events/${id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch event details');
                }

                setEvent(data);
            } catch (err) {
                console.error('Error fetching event details:', err);
                setError(err.message || 'Failed to fetch event details');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="event-details-page">
                <div className="event-details-container">
                    <p className="event-details-loading">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="event-details-page">
                <div className="event-details-container">
                    <div className="event-details-error">{error}</div>
                    <button className="event-details-back-btn" onClick={() => navigate('/eventListing')}>
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-page">
                <div className="event-details-container">
                    <div className="event-details-error">Event not found</div>
                    <button className="event-details-back-btn" onClick={() => navigate('/eventListing')}>
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const imageUrl =
        event.images && event.images.length > 0 && event.images[0].url
            ? event.images[0].url.startsWith('http')
                ? event.images[0].url
                : `http://localhost:5000${event.images[0].url}`
            : null;

    return (
        <div className="event-details-page">
            <header className="event-details-header">
                <div className="event-details-header-container">
                    <div className="event-details-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <button onClick={onLogout} className="event-details-logout-btn">Logout</button>
                </div>
            </header>

            <div className="event-details-container">
                <button className="event-details-back-btn" onClick={() => navigate('/eventListing')}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Events
                </button>

                <div className="event-details-card">
                    <div className="event-details-image-wrapper">
                        {imageUrl ? (
                            <img src={imageUrl} alt={event.title} className="event-details-image" />
                        ) : (
                            <div className="event-details-no-image">
                                <span className="material-symbols-outlined">image</span>
                                <p>No image available</p>
                            </div>
                        )}

                        {event.discountPercentage > 0 && (
                            <div className="event-details-discount-badge">
                                {event.discountPercentage}% OFF
                            </div>
                        )}

                        <div className={`event-details-status-badge ${event.status}`}>
                            {event.status}
                        </div>
                    </div>

                    <div className="event-details-content">
                        <div className="event-details-top">
                            <h1 className="event-details-title">{event.title}</h1>
                            <span className="event-details-type">{event.type}</span>
                        </div>

                        <p className="event-details-description">{event.description}</p>

                        <div className="event-details-info-grid">
                            <div className="event-details-info-item">
                                <span className="material-symbols-outlined">location_on</span>
                                <div>
                                    <strong>Location</strong>
                                    <p>{event.location?.address || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="event-details-info-item">
                                <span className="material-symbols-outlined">calendar_month</span>
                                <div>
                                    <strong>Date</strong>
                                    <p>{formatDate(event.startDate)} - {formatDate(event.endDate)}</p>
                                </div>
                            </div>

                            <div className="event-details-info-item">
                                <span className="material-symbols-outlined">schedule</span>
                                <div>
                                    <strong>Time</strong>
                                    <p>{event.startTime || 'N/A'} {event.endTime ? `- ${event.endTime}` : ''}</p>
                                </div>
                            </div>

                            <div className="event-details-info-item">
                                <span className="material-symbols-outlined">groups</span>
                                <div>
                                    <strong>Capacity</strong>
                                    <p>{event.maxAttendees || 'Not specified'}</p>
                                </div>
                            </div>
                        </div>

                        {event.discountPercentage > 0 && (
                            <div className="event-details-discount-box">
                                <h3>Discount Information</h3>
                                <p><strong>Discount:</strong> {event.discountPercentage}%</p>
                                <p><strong>Description:</strong> {event.discountDescription || 'Special event discount available'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;