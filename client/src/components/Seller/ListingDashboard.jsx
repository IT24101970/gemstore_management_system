import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../Home.css";
import "./ListingDashboard.css";

function ListingDashboard({ user, onLogout }) {
    const [gemstones, setGemstones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadFilter, setDownloadFilter] = useState("all");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchGemstones = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5000/api/gemstones/seller/my-listings", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGemstones(response.data.data || response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching gemstones", error);
                setLoading(false);
            }
        };

        fetchGemstones();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this listing?")) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`http://localhost:5000/api/gemstones/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGemstones(gemstones.filter(gem => gem._id !== id));
            } catch (error) {
                console.error("Error deleting gemstone", error);
                alert("Failed to delete listing.");
            }
        }
    };

    // ✅ UPDATED: Get image from Cloudinary or fallback
    const getGemImage = (gem) => {
        if (gem.images && gem.images.length > 0) {
            const primaryImage = gem.images.find(img => img.isPrimary);
            const imageToUse = primaryImage ? primaryImage : gem.images[0];

            // ✅ Check if it's a Cloudinary URL (starts with https)
            if (imageToUse.url && imageToUse.url.startsWith('http')) {
                return imageToUse.url; // It's already a full Cloudinary URL
            }

            // Fallback for local uploads (if any)
            return `http://localhost:5000/uploads/${imageToUse.url}`;
        }
        return 'https://via.placeholder.com/200x200?text=No+Image';
    };

    const handleEdit = (gem) => {
        navigate("/seller/edit", { state: { gem } });
    };

    const handleView = (gem) => {
        navigate("/seller/view", { state: { gem } });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "approved": return "status-approved";
            case "available": return "status-approved"; // Green for available
            case "pending": return "status-pending"; // Orange
            case "rejected": return "status-rejected"; // Red
            case "sold": return "status-sold"; // Grey/Blue
            default: return "status-pending";
        }
    };

    const getDisplayStatus = (gem) => {
        if (gem.status === 'sold') return 'sold';
        return gem.approvalStatus || 'pending';
    };

    const filteredGemstones = gemstones.filter(g => {
        if (downloadFilter === "available") return g.status === 'available' || !g.status;
        if (downloadFilter === "sold") return g.status === 'sold';
        if (["pending", "approved", "rejected"].includes(downloadFilter)) return g.approvalStatus === downloadFilter;
        return true;
    });

    const handleDownload = () => {

        const escapeCsv = (str) => {
            if (str == null) return '""';
            const escaped = String(str).replace(/"/g, '""');
            return `"${escaped}"`;
        };

        const headers = ["Database ID", "Creation Date", "Title", "Type", "Status", "Approval", "Price", "Carat", "Cut", "Color", "Clarity", "Origin", "Description"];
        const rows = filteredGemstones.map(gem => [
            escapeCsv(gem._id),
            escapeCsv(gem.createdAt ? new Date(gem.createdAt).toLocaleString() : "N/A"),
            escapeCsv(gem.title),
            escapeCsv(gem.type),
            escapeCsv(gem.status || 'available'),
            escapeCsv(gem.approvalStatus),
            escapeCsv(gem.price),
            escapeCsv(gem.attributes?.carat),
            escapeCsv(gem.attributes?.cut),
            escapeCsv(gem.attributes?.colorIntensity),
            escapeCsv(gem.attributes?.clarity),
            escapeCsv(gem.attributes?.origin),
            escapeCsv(gem.description)
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `My_Listings_${downloadFilter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="seller-dashboard-page">
            <header className="home-header">
                <div className="home-header-container">
                    <div className="home-logo" onClick={() => navigate('/home')}>
                        <span className="material-symbols-outlined">diamond</span>
                        <span>Ceylon Gems</span>
                    </div>

                    <nav className="home-nav">
                        <Link to="/home" className="nav-item">Home</Link>
                        <Link to="/auction" className="nav-item">Auctions</Link>
                        <Link to="/eventListing" className="nav-item">Events</Link>
                        {user && user.role === 'seller' && (
                            <Link to="/seller/dashboard" className="nav-item active">My Listings</Link>
                        )}
                    </nav>

                    <div className="home-user-actions">
                        {user && (
                            <>
                                <button className="home-icon-btn">
                                    <span className="material-symbols-outlined">notifications</span>
                                </button>
                                <button className="home-icon-btn">
                                    <span className="material-symbols-outlined">person</span>
                                </button>
                                <button onClick={onLogout} className="home-logout-btn">Logout</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="dashboard-container">
                <div className="dashboard-header">
                    <h2>My Listings</h2>
                    <div className="dashboard-actions-header">
                        <div className="download-group">
                            <select
                                className="download-select"
                                value={downloadFilter}
                                onChange={(e) => setDownloadFilter(e.target.value)}
                            >
                                <option value="all">All Listings</option>
                                <option value="available">Available Listings</option>
                                <option value="sold">Sold Listings</option>
                                <option value="pending">Pending Listings</option>
                                <option value="approved">Approved Listings</option>
                                <option value="rejected">Rejected Listings</option>
                            </select>
                            <button className="download-btn" onClick={handleDownload}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                Download CSV
                            </button>

                        </div>
                        <button className="create-btn" onClick={() => navigate('/seller/create')}>
                            + Create Listing
                        </button>
                        <button className="create-btn" onClick={() => navigate('/seller/createAuction')}>
                            + Create Auction
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p>Loading listings...</p>
                ) : filteredGemstones.length === 0 ? (
                    <div className="empty-state">
                        <p>{gemstones.length === 0 ? "You don't have any gemstone listings yet." : "No listings found for this filter."}</p>
                    </div>
                ) : (
                    <div className="gemstone-grid">
                        {filteredGemstones.map((gem, index) => (
                            <div key={gem._id || index} className="gem-card">
                                <div className="gem-image-container">
                                    {gem.images && gem.images.length > 0 ? (
                                        <img
                                            src={getGemImage(gem)}
                                            alt={gem.title}
                                            className="gem-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                                            }}
                                        />
                                    ) : (
                                        <div className="no-image">No Image Available</div>
                                    )}
                                    <span className={`status-badge ${getStatusClass(getDisplayStatus(gem))}`}>
                                    {getDisplayStatus(gem).charAt(0).toUpperCase() + getDisplayStatus(gem).slice(1)}
                                </span>
                                </div>

                                <div className="gem-details">
                                    <h3>{gem.title}</h3>
                                    <p className="gem-desc">{gem.description}</p>

                                    {gem.approvalStatus === "rejected" && (
                                        <div style={{ backgroundColor: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "6px", fontSize: "14px", marginBottom: "15px", border: "1px solid #fecaca" }}>
                                            <strong>Rejection Reason:</strong> {gem.rejectionReason || "No reason provided."}
                                        </div>
                                    )}

                                    {/* ✅ UPDATED: Show Cloudinary certificate link */}
                                    {gem.report && (
                                        <div style={{ marginBottom: "15px" }}>
                                            <a
                                                href={gem.report}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ fontSize: "12px", color: "#3b82f6", display: "inline-block", backgroundColor: "#eff6ff", padding: "4px 8px", borderRadius: "4px", textDecoration: "none", fontWeight: "bold" }}
                                            >
                                                📄 View Certificate
                                            </a>
                                        </div>
                                    )}

                                    <div className="gem-stats">
                                        <div className="stat">
                                            <span className="stat-label">Weight</span>
                                            <span className="stat-value">{gem.attributes?.carat || 'N/A'} ct</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-label">Price</span>
                                            <span className="stat-value">${gem.price || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button className="action-btn view-btn" onClick={() => handleView(gem)}>View</button>
                                        {gem.status !== "sold" && (
                                            <>
                                                <button className="action-btn edit-btn" onClick={() => handleEdit(gem)}>Edit</button>
                                                <button className="action-btn delete-btn" onClick={() => handleDelete(gem._id)}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                    <div style={{
                                        marginTop: "15px",
                                        padding: "8px",
                                        textAlign: "center",
                                        borderRadius: "6px",
                                        fontWeight: "bold",
                                        color: "white",
                                        fontSize: "12px",
                                        letterSpacing: "1px",
                                        backgroundColor: gem.status === "sold" ? "#64748b" : "#0ea5e9"
                                    }}>
                                        {(gem.status || 'available').toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: "50px", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}></p>
                    <Link to="/home" className="action-btn view-btn" style={{ padding: "10px 20px", textDecoration: "none", display: "inline-block" }}>
                        ← Back to Main Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ListingDashboard;