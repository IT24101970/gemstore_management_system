import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './EventPage.css';

const EventPage = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const currentLocation = useLocation();
    const isAdminView = currentLocation.pathname.startsWith('/admin');

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('All Locations');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('http://localhost:5000/api/events');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch events');
                }

                setEvents(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError(err.message || 'Failed to load events');
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleDeleteEvent = async (eventId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this event?');

        if (!confirmDelete) return;

        try {
            setDeletingId(eventId);

            const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete event');
            }

            setEvents((prev) => prev.filter((event) => event._id !== eventId));
            alert('Event deleted successfully');
        } catch (err) {
            console.error('Delete event error:', err);
            alert(err.message || 'Failed to delete event');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getEventStatus = (startDate, endDate) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { text: 'Upcoming', className: 'upcoming' };
        }

        if (now < start) return { text: 'Upcoming', className: 'upcoming' };
        if (now >= start && now <= end) return { text: 'Ongoing', className: 'ongoing' };
        return { text: 'Ended', className: 'ended' };
    };

    const normalizeTypeForFilter = (type) => {
        if (!type) return '';

        const value = type.toLowerCase().trim();

        if (value === 'exhibition') return 'Exhibition';
        if (value === 'trade_show') return 'Discount Sale';
        if (value === 'auction') return 'Auction Event';
        if (value === 'workshop') return 'Workshop';
        if (value === 'seminar') return 'Conference';

        return type;
    };

    const normalizeTypeLabel = (type) => {
        if (!type) return '';

        const value = type.toLowerCase().trim();

        if (value === 'exhibition') return 'Exhibition';
        if (value === 'trade_show') return 'Discount Sale';
        if (value === 'auction') return 'Auction Event';
        if (value === 'workshop') return 'Workshop';
        if (value === 'seminar') return 'Conference';

        return type;
    };

    const filteredEvents = events.filter((event) => {
        const query = searchQuery.toLowerCase().trim();

        const matchesSearch =
            !query ||
            event.title?.toLowerCase().includes(query) ||
            event.description?.toLowerCase().includes(query) ||
            event.location?.toLowerCase().includes(query) ||
            event.address?.toLowerCase().includes(query);

        const matchesLocation =
            locationFilter === 'All Locations' ||
            event.location?.toLowerCase() === locationFilter.toLowerCase();

        const matchesType =
            typeFilter === 'All Types' ||
            normalizeTypeForFilter(event.type).toLowerCase() === typeFilter.toLowerCase();

        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        let matchesStatus = true;

        if (filter === 'upcoming') {
            matchesStatus = start > now;
        } else if (filter === 'ongoing') {
            matchesStatus = start <= now && end >= now;
        } else if (filter === 'past') {
            matchesStatus = end < now;
        }

        return matchesSearch && matchesLocation && matchesType && matchesStatus;
    });

    return (
        <div className="event-page">
            <header className="event-header">
                <div className="event-header-container">
                    <div className="event-logo" onClick={() => navigate(isAdminView ? '/admin' : '/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    <nav className="event-nav">
                        <Link to={isAdminView ? '/admin' : '/home'} className="event-nav-item">
                            Home
                        </Link>

                        {!isAdminView && (
                            <Link to="/auction" className="event-nav-item">
                                Auctions
                            </Link>
                        )}

                        <Link to={isAdminView ? '/admin/event-listing' : '/eventListing'} className="event-nav-item active">
                            Events
                        </Link>

                        {!isAdminView && user && user.role === 'seller' && (
                            <Link to="/seller/dashboard" className="event-nav-item">
                                My Listings
                            </Link>
                        )}
                    </nav>

                    <div className="event-user-actions">
                        {user ? (
                            <>
                                {isAdminView && (
                                    <Link to="/createEvent" className="create-event-link">
                                        <span className="material-symbols-outlined">add</span>
                                        Create Event
                                    </Link>
                                )}

                                <button onClick={onLogout} className="event-logout-btn">
                                    Logout
                                </button>
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

            <div className="event-main">
                <div className="event-container">
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
                                <option>Jaffna</option>
                                <option>Trincomalee</option>
                                <option>Nuwara Eliya</option>
                                <option>Negombo</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option>All Types</option>
                                <option>Exhibition</option>
                                <option>Discount Sale</option>
                                <option>Auction Event</option>
                                <option>Workshop</option>
                                <option>Conference</option>
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

                    <div className="event-results-header">
                        <h2>{filteredEvents.length} Events Found</h2>
                    </div>

                    {loading && (
                        <div className="event-loading">
                            <div className="spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="event-error">
                            <span className="material-symbols-outlined">error</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && filteredEvents.length > 0 && (
                        <div className="event-grid">
                            {filteredEvents.map((event) => {
                                const status = getEventStatus(event.startDate, event.endDate);

                                const imageUrl =
                                    event.images?.[0]?.url
                                        ? event.images[0].url.startsWith('http') || event.images[0].url.startsWith('blob:')
                                            ? event.images[0].url
                                            : `http://localhost:5000${event.images[0].url}`
                                        : 'https://via.placeholder.com/400x300?text=Event';

                                return (
                                    <div key={event._id} className="event-card">
                                        <div className="event-card-image">
                                            <img
                                                src={imageUrl}
                                                alt={event.title}
                                            />

                                            <div className={`event-status-badge ${status.className}`}>
                                                {status.text}
                                            </div>

                                            {event.discount && Number(event.discount) > 0 && (
                                                <div className="event-discount-badge">
                                                    <span className="material-symbols-outlined">sell</span>
                                                    {event.discount}% OFF
                                                </div>
                                            )}
                                        </div>

                                        <div className="event-card-content">
                                            <div className="event-card-header">
                                                <h3 className="event-card-title">{event.title}</h3>
                                                <span className="event-type-tag">
                                                    {normalizeTypeLabel(event.type)}
                                                </span>
                                            </div>

                                            <div className="event-card-details">
                                                <div className="event-detail-item">
                                                    <span className="material-symbols-outlined">location_on</span>
                                                    <span>{event.address || event.location || 'N/A'}</span>
                                                </div>

                                                <div className="event-detail-item">
                                                    <span className="material-symbols-outlined">calendar_today</span>
                                                    <span>
                                                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="event-card-description">
                                                {event.description?.length > 120
                                                    ? `${event.description.substring(0, 120)}...`
                                                    : event.description}
                                            </p>

                                            <div className="event-card-actions">
                                                <button
                                                    type="button"
                                                    className="event-view-btn"
                                                    onClick={() => navigate(`/events/${event._id}`)}
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                    View Details
                                                </button>

                                                {isAdminView && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="event-update-btn"
                                                            onClick={() => navigate(`/admin/edit-event/${event._id}`)}
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                            Update
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="event-delete-btn"
                                                            onClick={() => handleDeleteEvent(event._id)}
                                                            disabled={deletingId === event._id}
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                            {deletingId === event._id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!loading && !error && filteredEvents.length === 0 && (
                        <div className="event-empty-state">
                            <span className="material-symbols-outlined">event_busy</span>
                            <h3>No events found</h3>
                            <p>Try changing your search or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventPage;