import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import CreateListing from './components/CreateListing';
import Wallet from './components/Wallet';
import SellerVerification from './components/SellerVerification';
import AdminPanel from './components/AdminPanel';

function Main() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/createListing" element={<CreateListing />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/adminPanel" element={<AdminPanel />} />
                <Route path="/sellerVerification" element={<SellerVerification />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Main;