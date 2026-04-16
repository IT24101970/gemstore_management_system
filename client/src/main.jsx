import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import AuctionPage from './components/AuctionPage';
import Login from './components/Login';
import Register from './components/Register';
import CreateEvent from "./components/CreateEvent.jsx";
import EventPage from "./components/EventPage.jsx";
import CreateAuction from "./components/Seller/CreateAuction.jsx";
import WalletDashboard from './components/WalletDashboard';
import SellerApprovals from './components/Admin/SellerApprovals';
import AdminLayout from './components/Admin/AdminLayout';
import Reports from './components/Admin/Reports';
import DisputeManagement from './components/Admin/DisputeManagement';
import GemstoneApprovals from './components/Admin/GemstoneApprovals';
import TransactionMonitor from './components/Admin/TransactionMonitor';
import EventDetails from './components/EventDetails';
import AdminEventsManagement from './components/Admin/AdminEventsManagement';
import AdminEventHistory from './components/Admin/AdminEventHistory';
import EditEvent from './components/Admin/EditEvent';
import ListingDashboard from './components/Seller/ListingDashboard';
import CreateListing from './components/Seller/CreateListing';
import EditListing from './components/Seller/EditListing';
import ViewListing from './components/Seller/ViewListing';
import GemDetails from './components/GemDetails';

function Main() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

                {/* Main Routes */}
                <Route
                    path="/home"
                    element={<Home user={user} onLogout={handleLogout} />}
                />

                {/*Auction Navigation*/}
                <Route
                    path="/auction"
                    element={user ?(
                        <AuctionPage user={user} onLogout={handleLogout} />
                    ):(
                        <Navigate to={'/login'}/>
                    )}
                />
                <Route
                    path="/createAuction"
                    element={user && user.role ==='seller' ? (
                        <CreateAuction user={user} onLogout={handleLogout} />
                    ):(
                        <Navigate to="/login"/>
                    )}
                />

                <Route
                    path="/wallet"
                    element={user ? <WalletDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                <Route
                    path="/createEvent"
                    element={user && user.role ==='seller' ? (
                        <CreateEvent user={user} onLogout={handleLogout} />
                    ):(
                        <Navigate to="/login"/>
                    )}
                />
                <Route
                    path="/eventListing"
                    element={<EventPage user={user} onLogout={handleLogout} />}
                />

                <Route path="/events/:id" element={<EventDetails user={user} onLogout={handleLogout} />} />
                <Route path="/gem/:id" element={<GemDetails user={user} onLogout={handleLogout} />} />

                {/* Seller Routes */}
                <Route path="/seller/dashboard" element={user && user.role ==='seller' ? <ListingDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                <Route path="/seller/create" element={user && user.role ==='seller' ? <CreateListing user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                <Route path="/seller/edit" element={user && user.role ==='seller' ? <EditListing user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                <Route path="/seller/view" element={user && user.role ==='seller' ? <ViewListing user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
                <Route path="/seller/createAuction" element={user && user.role ==='seller' ? <CreateAuction user={user} onLogout={handleLogout} /> : <Navigate to="/login"/>}/>


                {/* Admin Routes with Layout */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/sellers" />} />
                    <Route path="sellers" element={<SellerApprovals />} />
                    <Route path="gemstones" element={<GemstoneApprovals />} />
                    <Route path="events" element={<AdminEventsManagement />} />
                    <Route path="event-history" element={<AdminEventHistory />} />
                    <Route path="event-listing" element={<EventPage user={user} onLogout={handleLogout} />} />
                    <Route path="edit-event/:id" element={<EditEvent />} />
                    <Route path="transactions" element={<TransactionMonitor />} />
                    <Route path="disputes" element={<DisputeManagement />} />
                    <Route path="reports" element={<Reports />} />

                </Route>

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

