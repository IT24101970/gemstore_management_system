import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Event.css";

const EventList = () => {
    const [events, setEvents] = useState([]);

    const fetchEvents = async () => {
        const res = await axios.get("http://localhost:5000/api/events");
        setEvents(res.data.events);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="event-container">
            <h2 className="event-title">All Events</h2>

            <div className="event-grid">
                {events.map((ev) => (
                    <div className="event-card" key={ev._id}>
                        {ev.imageUrl && (
                            <img
                                className="event-img"
                                src={`http://localhost:5000${ev.imageUrl}`}
                                alt={ev.title}
                            />
                        )}

                        <h3 className="event-card-title">{ev.title}</h3>
                        <p className="event-card-text">
                            <b>Location:</b> {ev.location}
                        </p>
                        <p className="event-card-text">
                            <b>Venue:</b> {ev.venue}
                        </p>
                        <p className="event-card-text">
                            <b>Discount:</b> {ev.discountAmount}%
                        </p>
                        <p className="event-card-text">
                            <b>Date:</b> {ev.date} &nbsp; <b>Time:</b> {ev.time}
                        </p>
                        {ev.description && <p className="event-desc">{ev.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventList;