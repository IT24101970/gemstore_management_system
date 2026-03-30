import React from 'react';
import { useNavigate } from 'react-router-dom';
import './adminStyles.css';

function AdminEventsManagement() {
    const navigate = useNavigate();

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Events Management</h1>
                    <p className="admin-page-subtitle">
                        Manage event creation and view all created events.
                    </p>
                </div>

            </div>

            <div className="admin-events-grid">
                <div className="admin-event-card">
                    <span className="material-symbols-outlined admin-event-icon">event</span>
                    <h3>Create a New Event</h3>
                    <p>
                        Add a new gemstone event with title, dates, venue, description, and discount.
                    </p>
                    <button
                        className="admin-card-btn"
                        onClick={() => navigate('/createEvent')}
                    >
                        Create Event
                    </button>
                </div>

                <div className="admin-event-card">
                    <span className="material-symbols-outlined admin-event-icon">list_alt</span>
                    <h3>View Event Listings</h3>
                    <p>
                        View all created events and check what customers can see in the event page.
                    </p>
                    <button
                        className="admin-card-btn secondary"
                        onClick={() => navigate('/eventListing')}
                    >
                        View Events
                    </button>
                </div>
                <div className="admin-event-card">
                    <span className="material-symbols-outlined admin-event-icon">history</span>
                    <h3>Purchase History</h3>
                    <p>
                        View customers who purchased gemstones during event periods and applied discounts.
                    </p>
                    <button
                        className="admin-card-btn secondary"
                        onClick={() => navigate('/admin/event-history')}
                    >
                        View History
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminEventsManagement;