import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditEvent.css';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        description: '',
        type: '',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        capacity: '',
        discount: '',
        discountDescription: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/events/${id}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch event');
                }

                setForm({
                    title: data.title || '',
                    description: data.description || '',
                    type: data.type || '',
                    location: data.location?.city || '',
                    address: data.location?.venue || data.location?.address || '',
                    startDate: data.startDate ? data.startDate.split('T')[0] : '',
                    endDate: data.endDate ? data.endDate.split('T')[0] : '',
                    startTime: data.startTime || '',
                    endTime: data.endTime || '',
                    capacity: data.maxAttendees || '',
                    discount: data.discountPercentage || '',
                    discountDescription: data.discountDescription || ''
                });
            } catch (err) {
                setError(err.message || 'Failed to load event');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: form.title,
                description: form.description,
                type: form.type,
                location: form.location,
                address: form.address,
                startDate: form.startDate,
                endDate: form.endDate,
                startTime: form.startTime,
                endTime: form.endTime,
                capacity: form.capacity ? Number(form.capacity) : undefined,
                hasDiscount: Number(form.discount) > 0,
                discount: form.discount ? Number(form.discount) : 0,
                discountDescription: form.discountDescription
            };

            const res = await fetch(`http://localhost:5000/api/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update event');
            }

            setSuccess('Event updated successfully');

            setTimeout(() => {
                navigate('/admin/event-listing');
            }, 1200);
        } catch (err) {
            setError(err.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="edit-event-page"><p className="edit-loading">Loading event...</p></div>;
    }

    return (
        <div className="edit-event-page">
            <div className="edit-event-container">
                <div className="edit-event-header">
                    <h1>Edit Event</h1>
                    <button
                        className="edit-back-btn"
                        onClick={() => navigate('/admin/event-listing')}
                    >
                        Back to Events
                    </button>
                </div>

                <div className="edit-event-card">
                    {error && <div className="edit-error">{error}</div>}
                    {success && <div className="edit-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="edit-event-form">
                        <div className="edit-grid">
                            <div className="edit-group full">
                                <label>Event Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="edit-group full">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="edit-group">
                                <label>Event Type</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                >
                                    <option value="exhibition">Exhibition</option>
                                    <option value="trade_show">Discount Sale</option>
                                    <option value="auction">Auction Event</option>
                                    <option value="workshop">Workshop</option>
                                    <option value="seminar">Conference</option>
                                </select>
                            </div>

                            <div className="edit-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="Colombo"
                                    required
                                />
                            </div>

                            <div className="edit-group">
                                <label>Venue</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="BMICH / Main Hall"
                                    required
                                />
                            </div>

                            <div className="edit-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="edit-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="edit-group">
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="edit-group">
                                <label>End Time</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={form.endTime}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="edit-group">
                                <label>Capacity</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={form.capacity}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="edit-group">
                                <label>Discount %</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={form.discount}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="edit-group full">
                                <label>Discount Description</label>
                                <input
                                    type="text"
                                    name="discountDescription"
                                    value={form.discountDescription}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="edit-actions">
                            <button type="submit" className="edit-save-btn" disabled={saving}>
                                {saving ? 'Updating...' : 'Update Event'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditEvent;