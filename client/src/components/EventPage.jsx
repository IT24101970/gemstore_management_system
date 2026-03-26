import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './EventPage.css';

const EventPage = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, past
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('All Locations');
    const [typeFilter, setTypeFilter] = useState('All Types');


    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/events');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch events');
                }

                setEvents(data);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Failed to load events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Replace with actual API call
            // const response = await eventAPI.getAll();
            // setEvents(response.data);

            // Demo data for now
            setEvents([]);
            setLoading(false);
        } catch (err) {
            setError('Failed to load events');
            setLoading(false);
            console.error(err);
        }
    };

    // Filter events
    const getFilteredEvents = () => {
        let filtered = [...events];

        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (locationFilter !== 'All Locations') {
            filtered = filtered.filter(event => event.location === locationFilter);
        }

        if (typeFilter !== 'All Types') {
            filtered = filtered.filter(event => event.type === typeFilter);
        }

        if (filter === 'upcoming') {
            const now = new Date();
            filtered = filtered.filter(event => new Date(event.startDate) > now);
        } else if (filter === 'ongoing') {
            const now = new Date();
            filtered = filtered.filter(event =>
                new Date(event.startDate) <= now && new Date(event.endDate) >= now
            );
        } else if (filter === 'past') {
            const now = new Date();
            filtered = filtered.filter(event => new Date(event.endDate) < now);
        }

        return filtered;
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Get event status
    const getEventStatus = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (now < start) return { text: 'Upcoming', className: 'upcoming' };
        if (now >= start && now <= end) return { text: 'Ongoing', className: 'ongoing' };
        return { text: 'Ended', className: 'ended' };
    };


    const filteredEvents = getFilteredEvents();

    return (
        <div className="event-page">
            {/* Header */}
            <header className="event-header">
                <div className="event-header-container">
                    <div className="event-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <nav className="event-nav">
                        <Link to="/home" className="event-nav-item">Home</Link>
                        <Link to="/auction" className="event-nav-item">Auctions</Link>
                        <Link to="/events" className="event-nav-item active">Events</Link>
                    </nav>
                    <div className="event-user-actions">
                        {user ? (
                            <>
                                <div className="event-wallet">
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                    <span>$4,250</span>
                                </div>
                                {user.role === 'seller' && (
                                    <Link to="/create-event" className="create-event-link">
                                        <span className="material-symbols-outlined">add</span>
                                        Create Event
                                    </Link>
                                )}
                                <button onClick={onLogout} className="event-logout-btn">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="event-login-link">Login</Link>
                                <Link to="/register" className="event-register-link">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="event-hero">
                <div className="event-hero-content">
                    <h1 className="event-hero-title">
                        <span className="material-symbols-outlined">celebration</span>
                        Gemstone Events
                    </h1>
                    <p className="event-hero-subtitle">
                        Join exclusive gemstone exhibitions, fairs, and special discount events
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="event-main">
                <div className="event-container">
                    {/* Search and Filters */}
                    <div className="event-controls">
                        <div className="event-search">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="event-filters">
                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                            >
                                <option>All Locations</option>
                                <option>Colombo</option>
                                <option>Ratnapura</option>
                                <option>Kandy</option>
                                <option>Galle</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option>All Types</option>
                                <option>Exhibition</option>
                                <option>Fair</option>
                                <option>Discount Sale</option>
                                <option>Auction Event</option>
                            </select>
                        </div>

                        <div className="event-filter-tabs">
                            <button
                                className={`event-filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All Events
                            </button>
                            <button
                                className={`event-filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setFilter('upcoming')}
                            >
                                <span className="material-symbols-outlined">schedule</span>
                                Upcoming
                            </button>
                            <button
                                className={`event-filter-tab ${filter === 'ongoing' ? 'active' : ''}`}
                                onClick={() => setFilter('ongoing')}
                            >
                                <span className="material-symbols-outlined">live_tv</span>
                                Ongoing
                            </button>
                            <button
                                className={`event-filter-tab ${filter === 'past' ? 'active' : ''}`}
                                onClick={() => setFilter('past')}
                            >
                                Past Events
                            </button>
                        </div>
                    </div>

                    {/* Results Header */}
                    <div className="event-results-header">
                        <h2>{filteredEvents.length} Events Found</h2>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="event-loading">
                            <div className="spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="event-error">
                            <span className="material-symbols-outlined">error</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Events Grid */}
                    {!loading && filteredEvents.length > 0 && (
                        <div className="event-grid">
                            {filteredEvents.map((event) => {
                                const status = getEventStatus(event.startDate, event.endDate);

                                return (
                                    <div key={event._id} className="event-card">
                                        <div className="event-card-image">
                                            <img src={event.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=Event'} alt={event.title} />
                                            <div className={`event-status-badge ${status.className}`}>
                                                {status.text}
                                            </div>
                                            {event.discount && (
                                                <div className="event-discount-badge">
                                                    <span className="material-symbols-outlined">sell</span>
                                                    {event.discount}% OFF
                                                </div>
                                            )}
                                        </div>

                                        <div className="event-card-content">
                                            <div className="event-card-header">
                                                <h3 className="event-card-title">{event.title}</h3>
                                                <span className="event-type-tag">{event.type}</span>
                                            </div>

                                            <div className="event-card-details">
                                                <div className="event-detail-item">
                                                    <span className="material-symbols-outlined">location_on</span>
                                                    <span>{event.location}</span>
                                                </div>
                                                <div className="event-detail-item">
                                                    <span className="material-symbols-outlined">calendar_today</span>
                                                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                                                </div>
                                            </div>

                                            <p className="event-card-description">
                                                {event.description?.substring(0, 120)}...
                                            </p>

                                            <div className="event-card-footer">
                                                <button
                                                    type="button"
                                                    className="event-view-btn"
                                                    onClick={() => navigate(`/events/${event._id}`)}
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && filteredEvents.length === 0 && (
                        <div className="event-no-results">
                            <span className="material-symbols-outlined">event_busy</span>
                            <h3>No events found</h3>
                            <p>Try adjusting your filters or check back later for upcoming events</p>
                            {user?.role === 'seller' && (
                                <Link to="/create-event" className="create-first-event-btn">
                                    <span className="material-symbols-outlined">add</span>
                                    Create Your First Event
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="event-footer">
                <div className="event-footer-container">
                    <p>&copy; 2024 Ceylon Gems. All rights reserved.</p>
                    <div className="event-footer-links">
                        <a href="#">Terms</a>
                        <a href="#">Privacy</a>
                        <a href="#">Help</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EventPage;