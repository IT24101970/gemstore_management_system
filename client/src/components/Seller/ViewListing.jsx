import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import NavBar from "../NavBar"; // ✅ Import NavBar
import "../Home.css";
import "./ViewListing.css";

function ViewListing({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [balance, setBalance] = useState(0); // ✅ Add balance state

    // Get the gemstone state passed from ListingDashboard
    const gem = location.state?.gem;

    // ✅ Fetch wallet balance
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/wallet/balance", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setBalance(data.data?.balance || 0);
            } catch (error) {
                console.error("Error fetching balance", error);
                setBalance(0);
            }
        };

        if (user) {
            fetchBalance();
        }
    }, [user]);

    if (!gem) {
        return (
            <div className="container" style={{ textAlign: "center", padding: "50px" }}>
                <h2>Listing not found</h2>
                <button className="back-btn" onClick={() => navigate("/seller/dashboard")}>← Back to Dashboard</button>
            </div>
        );
    }

    const getStatusClass = (status) => {
        switch(status) {
            case "approved": return "status-approved";
            case "pending": return "status-pending";
            case "rejected": return "status-rejected";
            case "sold": return "status-sold";
            default: return "status-pending";
        }
    };

    const getDisplayStatus = (gem) => {
        if (gem.status === 'sold') return 'sold';
        return gem.approvalStatus || 'pending';
    };

    return (
        <div className="seller-dashboard-page">
            {/* ✅ Replace old header with NavBar */}
            <NavBar user={user} onLogout={onLogout} balance={balance} />

            <div className="view-container">
                <div className="view-header">
                    <button className="back-btn" onClick={() => navigate("/seller/dashboard")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Dashboard
                    </button>
                    <span className={`status-badge-lg ${getStatusClass(getDisplayStatus(gem))}`}>
                        Status: {getDisplayStatus(gem).toUpperCase()}
                    </span>
                </div>

                <div className="view-content">
                    <div className="view-images">
                        {gem.images && gem.images.length > 0 ? (
                            <div className="main-image-wrapper">
                                <img
                                    src={gem.images[mainImageIndex].url.startsWith('http') ? gem.images[mainImageIndex].url : `http://localhost:5000/uploads/${gem.images[mainImageIndex].url}`}
                                    alt={gem.title}
                                    className="main-image"
                                />
                                {gem.images.length > 1 && (
                                    <div className="thumbnail-gallery">
                                        {gem.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img.url.startsWith('http') ? img.url : `http://localhost:5000/uploads/${img.url}`}
                                                alt={`${gem.title} view ${idx + 1}`}
                                                className={`thumbnail ${mainImageIndex === idx ? 'active-thumbnail' : ''}`}
                                                onClick={() => setMainImageIndex(idx)}
                                                style={{ cursor: "pointer", border: mainImageIndex === idx ? "2px solid #3b82f6" : "1px solid #cbd5e1" }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-image-lg">No Images Provided</div>
                        )}
                    </div>

                    <div className="view-details">
                        <h1 className="view-title">{gem.title}</h1>
                        <p className="view-price">${gem.price}</p>

                        <div className="view-description">
                            <h3>Description</h3>
                            <p>{gem.description}</p>
                        </div>

                        <div className="specifications-panel">
                            <h3>Specifications</h3>
                            <ul className="spec-list">
                                <li><span className="spec-label">Weight:</span> <span className="spec-value">{gem.attributes?.carat || 'N/A'} carats</span></li>
                                {gem.attributes?.shape && <li><span className="spec-label">Shape:</span> <span className="spec-value">{gem.attributes?.shape}</span></li>}
                                {gem.attributes?.cut && <li><span className="spec-label">Cut:</span> <span className="spec-value">{gem.attributes?.cut}</span></li>}
                                {gem.attributes?.colorIntensity && <li><span className="spec-label">Color Intensity:</span> <span className="spec-value">{gem.attributes?.colorIntensity}</span></li>}
                                {gem.attributes?.clarity && <li><span className="spec-label">Clarity:</span> <span className="spec-value">{gem.attributes?.clarity}</span></li>}
                                {gem.attributes?.origin && <li><span className="spec-label">Origin:</span> <span className="spec-value">{gem.attributes?.origin}</span></li>}
                                {gem.sellingMethod && <li><span className="spec-label">Selling Method:</span> <span className="spec-value">{gem.sellingMethod}</span></li>}
                            </ul>
                        </div>

                        {gem.report && (
                            <div className="report-section">
                                <h3>Lab Certificate / Report</h3>
                                <a
                                    href={gem.report.startsWith('http') ? gem.report : `http://localhost:5000/uploads/${gem.report}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="view-report-btn"
                                >
                                    📄 View Document
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewListing;