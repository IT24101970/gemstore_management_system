import React, { useEffect, useState } from 'react';
import './adminStyles.css';

function AdminEventHistory() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch('http://localhost:5000/api/events/history');
            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || 'Failed to fetch purchase history');
            }

            setData(Array.isArray(result) ? result : []);
        } catch (err) {
            console.error('History fetch error:', err);
            setError(err.message || 'Failed to load purchase history');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="admin-page">Loading purchase history...</div>;
    }

    if (error) {
        return <div className="admin-page">Error: {error}</div>;
    }

    return (
        <div className="admin-page">
            <h1 className="admin-page-title">Event Purchase History</h1>
            <p className="admin-page-subtitle">
                Read-only view of customers who purchased gemstones during event periods.
            </p>

            <table className="admin-table">
                <thead>
                <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Gem</th>
                    <th>Original Price</th>
                    <th>Discount</th>
                    <th>Final Price</th>
                    <th>Order Date</th>
                    <th>Event</th>
                </tr>
                </thead>
                <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td colSpan="8" style={{ color: '#000000'  ,textAlign: 'center'  }}>
                            No purchase history found
                        </td>
                    </tr>
                ) : (
                    data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.customerName || 'N/A'}</td>
                            <td>{item.email || 'N/A'}</td>
                            <td>{item.gemName || 'N/A'}</td>
                            <td>{item.originalPrice ?? 0}</td>
                            <td>{item.discount ?? 0}</td>
                            <td>{item.finalPrice ?? 0}</td>
                            <td>
                                {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>{item.eventName || 'N/A'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );
}

export default AdminEventHistory;