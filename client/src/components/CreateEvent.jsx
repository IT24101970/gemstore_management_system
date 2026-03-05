import React, { useState } from "react";
import axios from "axios";
import "./Event.css";

const CreateEvent = () => {
    const [form, setForm] = useState({
        title: "",
        location: "",
        venue: "",
        discountAmount: "",
        date: "",
        time: "",
        description: "",
    });

    const [image, setImage] = useState(null);
    const [msg, setMsg] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setMsg("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const data = new FormData();
            Object.keys(form).forEach((key) => data.append(key, form[key]));
            if (image) data.append("image", image);

            await axios.post("http://localhost:5000/api/events", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMsg("✅ Event created successfully!");
            setForm({
                title: "",
                location: "",
                venue: "",
                discountAmount: "",
                date: "",
                time: "",
                description: "",
            });
            setImage(null);
        } catch (err) {
            setMsg("❌ Failed to create event");
            console.error(err);
        }
    };

    return (
        <div className="event-container">
            <h2 className="event-title">Create Event</h2>

            {msg && <p className="event-msg">{msg}</p>}

            <form className="event-form" onSubmit={handleSubmit}>
                <input
                    className="event-input"
                    name="title"
                    placeholder="Event name"
                    value={form.title}
                    onChange={handleChange}
                    required
                />

                <input
                    className="event-input"
                    name="location"
                    placeholder="Location (City/Area)"
                    value={form.location}
                    onChange={handleChange}
                    required
                />

                <input
                    className="event-input"
                    name="venue"
                    placeholder="Venue (Place)"
                    value={form.venue}
                    onChange={handleChange}
                    required
                />

                <input
                    className="event-input"
                    name="discountAmount"
                    type="number"
                    placeholder="Discount amount (%)"
                    value={form.discountAmount}
                    onChange={handleChange}
                    required
                />

                <div className="event-row">
                    <input
                        className="event-input"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                    <input
                        className="event-input"
                        name="time"
                        type="time"
                        value={form.time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <textarea
                    className="event-textarea"
                    name="description"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={handleChange}
                />

                <label className="event-upload">
                    Upload event image
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                    />
                </label>

                <button className="event-btn" type="submit">
                    Create Event
                </button>
            </form>
        </div>
    );
};

export default CreateEvent;