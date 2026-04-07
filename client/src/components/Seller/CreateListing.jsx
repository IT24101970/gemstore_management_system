import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../Home.css";
import "./CreateListing.css";

function CreateListing({ user, onLogout }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        type: "",
        description: "",
        carat: "",
        shape: "",
        cut: "",
        colorIntensity: "",
        clarity: "",
        origin: "",
        price: "",
        images: [],
        report: null
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (formData.images.length + newFiles.length > 3) {
            alert(`You can only upload a maximum of 3 images! You currently have ${formData.images.length} selected.`);
            e.target.value = null;
            return;
        }
        setFormData({
            ...formData,
            images: [...formData.images, ...newFiles]
        });
        e.target.value = null;
    };

    const removeNewImage = (indexToRemove) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, idx) => idx !== indexToRemove)
        });
    };

    const handleReportChange = (e) => {
        setFormData({
            ...formData,
            report: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.images.length === 0) {
            alert("Please accurately upload at least one image of your gemstone.");
            return;
        }

        if (!formData.report) {
            alert("A valid laboratory certificate is compulsory to list a gemstone.");
            return;
        }

        const form = new FormData();

        form.append("title", formData.title);
        form.append("type", formData.type);
        form.append("description", formData.description);
        form.append("price", formData.price);
        form.append("sellingMethod", "instantPurchase");

        const attributes = {
            carat: formData.carat,
            shape: formData.shape,
            cut: formData.cut,
            colorIntensity: formData.colorIntensity,
            clarity: formData.clarity,
            origin: formData.origin
        };
        form.append("attributes", JSON.stringify(attributes));

        for (let i = 0; i < formData.images.length; i++) {
            form.append("images", formData.images[i]);
        }

        if (formData.report) {
            form.append("report", formData.report);
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:5000/api/gemstones",
                form,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            alert("Listing Created Successfully!");

            // Redirect back to seller dashboard after success
            navigate("/seller/dashboard");

        } catch (error) {
            console.error(error);
            alert("Error creating listing");
        }
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

            <div className="create-listing-wrapper">
                <button className="back-btn" onClick={() => navigate("/seller/dashboard")}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Dashboard
                </button>
                <h1>Create New Gemstone Listing</h1>

                <form onSubmit={handleSubmit}>
                    <div className="create-listing-layout">
                        {/* Left Column */}
                        <div className="left-column">
                            {/* GemStone Details Card */}
                            <div className="form-card">
                                <div className="card-title">GemStone Details</div>
                                
                                <div className="form-group">
                                    <input name="title" placeholder="Gem Title" onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <select name="type" onChange={handleChange} value={formData.type} required>
                                        <option value="" disabled>Gem Type</option>
                                        <option value="Sapphire">Sapphire</option>
                                        <option value="Padparadscha">Padparadscha</option>
                                        <option value="Ruby">Ruby</option>
                                        <option value="Emerald">Emerald</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input name="description" placeholder="Description" onChange={handleChange} required />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <input name="carat" placeholder="weight (Carats)" type="number" step="0.01" min="0.01" onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="shape" placeholder="Shape" onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="cut" placeholder="Cut" onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <select name="colorIntensity" onChange={handleChange} defaultValue="" required>
                                            <option value="" disabled>Color Intensity</option>
                                            <option value="Light">Light</option>
                                            <option value="Vivid">Vivid</option>
                                            <option value="Deep">Deep</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <input name="clarity" placeholder="Clarity" onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="origin" placeholder="Origin" onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* Set Price Card */}
                            <div className="form-card">
                                <div className="card-title">Set price</div>
                                <div className="form-group mb-0">
                                    <input name="price" placeholder="Price" type="number" step="0.01" min="0.01" onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="form-card">
                                <div className="upload-title">Upload Gemstone Images (Compulsory)</div>
                                <div className="file-upload">
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} required={formData.images.length === 0} />
                                </div>
                                {formData.images.length > 0 && (
                                    <div style={{ marginTop: "10px", marginBottom: "20px" }}>
                                        <p style={{ fontSize: "14px", color: "#475569", marginBottom: "10px" }}>Selected Images ({formData.images.length}/3)</p>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {formData.images.map((file, idx) => (
                                                <div key={idx} style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                                                    <img src={URL.createObjectURL(file)} alt="preview" style={{ width: "80px", height: "80px", objectFit: "cover", display: "block" }} />
                                                    <button type="button" onClick={() => removeNewImage(idx)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(220,38,38,0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="upload-title">Upload Certificate (Compulsory)</div>
                                <div className="file-upload">
                                    <input type="file" onChange={handleReportChange} accept=".pdf,.doc,.docx" required />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="submit-btn">Submit listing</button>
                                <button type="button" className="draft-btn" onClick={() => navigate('/seller/dashboard')}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateListing;
