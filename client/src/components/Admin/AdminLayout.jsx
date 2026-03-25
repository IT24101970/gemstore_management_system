import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AdminStyles.css';

function AdminLayout() {
    const location = useLocation();

    const navItems = [
        { path: '/admin/sellers', label: 'Seller Verification', icon: 'verified_user' },
        { path: '/admin/events', label: 'Events Management', icon: 'event' },
        { path: '/admin/transactions', label: 'Transactions', icon: 'receipt' },
        { path: '/admin/disputes', label: 'Disputes', icon: 'gavel' },
        { path: '/admin/reports', label: 'Reports', icon: 'insights' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>
                    <p className="sidebar-subtitle">Admin Portal</p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="logout-btn"
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                        }}
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;