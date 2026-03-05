import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import CreateListing from './components/CreateListing';
import Wallet from './components/Wallet';
import SellerVerification from './components/SellerVerification';
import AuctionPage from './components/AuctionPage';
//import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';
import EventList from "./components/EventList.jsx";

function Main() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app load
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleRegisterSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontSize: '1.5rem',
                color: '#64748b'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Auth Routes */}
                <Route
                    path="/login"
                    element={<Login onLoginSuccess={handleLoginSuccess} />}
                />
                <Route
                    path="/register"
                    element={<Register onRegisterSuccess={handleRegisterSuccess} />}
                />

                {/* ALL ROUTES - NO RESTRICTIONS (for development/testing) */}
                <Route
                    path="/home"
                    element={<Home user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/auction"
                    element={<AuctionPage user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/wallet"
                    element={<Wallet user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/createListing"
                    element={<CreateListing user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/sellerVerification"
                    element={<SellerVerification user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/createListing"
                    element={<CreateListing user={user} onLogout={handleLogout} />}
                />

                <Route
                    path="/eventListing"
                    element={<EventList user={user} onLogout={handleLogout} />}
                />



                {/*<Route
                    path="/adminPanel"
                    element={<AdminPanel user={user} onLogout={handleLogout} />}
                />*/}

                {/* Default redirect */}
                <Route
                    path="/"
                    element={<Navigate to="/home" />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default Main;