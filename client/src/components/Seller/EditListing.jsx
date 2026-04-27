import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import NavBar from "../NavBar";
import "../Home.css";
import "./CreateListing.css"; // Reuse existing form styles

function EditListing({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the gemstone state passed from ListingDashboard
    const gemToEdit = location.state?.gem;

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
        report: null,
        retainedImages: [],
        retainReport: true
    });

    // Populate the form if gem data exists
    useEffect(() => {
        if (!gemToEdit) {
            navigate("/seller/dashboard"); // Return to dashboard if accessed directly without data
            return;
        }

        setFormData({
            title: gemToEdit.title || "",
            type: gemToEdit.type || "",
            description: gemToEdit.description || "",
            carat: gemToEdit.attributes?.carat || "",
            shape: gemToEdit.attributes?.shape || "",
            cut: gemToEdit.attributes?.cut || "",
            colorIntensity: gemToEdit.attributes?.colorIntensity || "",
            clarity: gemToEdit.attributes?.clarity || "",
            origin: gemToEdit.attributes?.origin || "",
            price: gemToEdit.price || "",
            images: [], // reset file inputs because browser security stops us from prefilling files
            report: null,
            retainedImages: gemToEdit.images ? gemToEdit.images.map(img => img.url) : [],
            retainReport: !!gemToEdit.report
        });
    }, [gemToEdit, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (formData.retainedImages.length + formData.images.length + newFiles.length > 3) {
            alert(`You can only have a maximum of 3 images total. You currently have ${formData.retainedImages.length} retained and ${formData.images.length} new images.`);
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

    const removeRetainedImage = (urlToRemove) => {
        setFormData({
            ...formData,
            retainedImages: formData.retainedImages.filter(url => url !== urlToRemove)
        });
    };

    const removeRetainedReport = () => {
        setFormData({ ...formData, retainReport: false });
    };

    const handleReportChange = (e) => {
        setFormData({
            ...formData,
            report: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.retainedImages.length === 0 && formData.images.length === 0) {
            alert("You must safely retain or upload at least one image of the gemstone.");
            return;
        }

        if (!formData.retainReport && !formData.report) {
            alert("A valid laboratory certificate is compulsory. Please safely retain the existing certificate or upload a new one.");
            return;
        }

        const form = new FormData();

        form.append("title", formData.title);
        form.append("type", formData.type);
        form.append("description", formData.description);
        form.append("price", formData.price);

        const attributes = {
            carat: formData.carat,
            shape: formData.shape,
            cut: formData.cut,
            colorIntensity: formData.colorIntensity,
            clarity: formData.clarity,
            origin: formData.origin
        };
        form.append("attributes", JSON.stringify(attributes));

        // Append retained file data
        form.append("retainedImages", JSON.stringify(formData.retainedImages));
        form.append("retainReport", formData.retainReport.toString());

        // Only append images if user selected new ones
        if (formData.images.length > 0) {
            for (let i = 0; i < formData.images.length; i++) {
                form.append("images", formData.images[i]);
            }
        }

        // Only append report if user selected a new one
        if (formData.report) {
            form.append("report", formData.report);
        }

        try {
            const token = localStorage.getItem("token");
            await axios.put(
                `http://localhost:5000/api/gemstones/${gemToEdit._id}`,
                form,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            alert("Listing Updated Successfully!");
            navigate("/seller/dashboard"); // Redirect back to dashboard

        } catch (error) {
            console.error(error);
            alert("Error updating listing");
        }
    };

    if (!gemToEdit) return <p>Loading...</p>;

    return (
        <div className="seller-dashboard-page">
            <NavBar user={user} onLogout={onLogout} />

            <div className="create-listing-wrapper">
                <button className="back-btn" onClick={() => navigate("/seller/dashboard")}>
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Dashboard
                </button>
                <h1>Edit Gemstone Listing</h1>
                <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    Leave files blank if you want to keep the existing images and certificate.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="create-listing-layout">
                        {/* Left Column */}
                        <div className="left-column">
                            {/* GemStone Details Card */}
                            <div className="form-card">
                                <div className="card-title">GemStone Details</div>
                                
                                <div className="form-group">
                                    <input name="title" placeholder="Gem Title" value={formData.title} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <select name="type" value={formData.type} onChange={handleChange} required>
                                        <option value="" disabled>Gem Type</option>
                                        <option value="Sapphire">Sapphire</option>
                                        <option value="Padparadscha">Padparadscha</option>
                                        <option value="Ruby">Ruby</option>
                                        <option value="Emerald">Emerald</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <input name="description" placeholder="Description" value={formData.description} onChange={handleChange} required />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <input name="carat" placeholder="weight (Carats)" type="number" step="0.01" min="0.01" value={formData.carat} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="shape" placeholder="Shape" value={formData.shape} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="cut" placeholder="Cut" value={formData.cut} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <select name="colorIntensity" value={formData.colorIntensity} onChange={handleChange} required>
                                            <option value="" disabled>Color Intensity</option>
                                            <option value="Light">Light</option>
                                            <option value="Vivid">Vivid</option>
                                            <option value="Deep">Deep</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <input name="clarity" placeholder="Clarity" value={formData.clarity} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <input name="origin" placeholder="Origin" value={formData.origin} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* Set Price Card */}
                            <div className="form-card">
                                <div className="card-title">Set price</div>
                                <div className="form-group mb-0">
                                    <input name="price" placeholder="Price" type="number" step="0.01" min="0.01" value={formData.price} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="right-column">
                            <div className="form-card">
                                <div className="card-title">Current Media</div>
                                
                                {formData.retainedImages.length > 0 && (
                                    <div style={{ marginBottom: "20px" }}>
                                        <p style={{ fontSize: "14px", color: "#475569", marginBottom: "10px" }}>Existing Images ({formData.retainedImages.length}/3)</p>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {formData.retainedImages.map((url, idx) => (
                                                <div key={idx} style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                                                    <img src={url.startsWith('http') ? url : `http://localhost:5000/uploads/${url}`} alt="existing" style={{ width: "80px", height: "80px", objectFit: "cover", display: "block" }} />
                                                    <button type="button" onClick={() => removeRetainedImage(url)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(220,38,38,0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.retainReport && gemToEdit.report && (
                                    <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <a href={gemToEdit.report.startsWith('http') ? gemToEdit.report : `http://localhost:5000/uploads/${gemToEdit.report}`} target="_blank" rel="noreferrer" style={{ fontSize: "14px", color: "#3b82f6", textDecoration: "none" }}>📄 View Existing Certificate</a>
                                        <button type="button" onClick={removeRetainedReport} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Remove</button>
                                    </div>
                                )}

                                <hr style={{ borderTop: "1px solid #e2e8f0", marginBottom: "20px" }} />

                                <div className="upload-title">Upload New Gemstone Images (max 3 total)</div>
                                <div className="file-upload">
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                                </div>
                                {formData.images.length > 0 && (
                                    <div style={{ marginTop: "10px", marginBottom: "20px" }}>
                                        <p style={{ fontSize: "14px", color: "#475569", marginBottom: "10px" }}>New Images ({formData.images.length})</p>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {formData.images.map((file, idx) => (
                                                <div key={idx} style={{ position: "relative", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
                                                    <img src={URL.createObjectURL(file)} alt="new" style={{ width: "80px", height: "80px", objectFit: "cover", display: "block" }} />
                                                    <button type="button" onClick={() => removeNewImage(idx)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(220,38,38,0.9)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="upload-title">Upload New Lab Report (.pdf,.doc)</div>
                                <div className="file-upload">
                                    <input type="file" onChange={handleReportChange} accept=".pdf,.doc,.docx" />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="submit-btn">Update Listing</button>
                                <button type="button" className="draft-btn" onClick={() => navigate('/seller/dashboard')}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditListing;
