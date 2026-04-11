  import React, { useState, useEffect } from 'react';

    import api from '../../services/api';

    import toast from 'react-hot-toast';

    import { useNavigate } from 'react-router-dom';

    import '../../view/styles/Dashboard.css';

    import '../../view/styles/Management.css';

    import '../styles/EventCards.css'; // The isolated CSS for Milap's cards



    const UserDashboard = () => {

        const navigate = useNavigate();

       

        // Logic States (Milap)

        const [events, setEvents] = useState([]);

        const [myEvents, setMyEvents] = useState([]);

        const [loading, setLoading] = useState(true);

        const [processingId, setProcessingId] = useState(null);

        const [activeFeedback, setActiveFeedback] = useState(null);

        const [rating, setRating] = useState(5);

        const [comment, setComment] = useState('');

        const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);



        // UI States (Sakshi)

        const [activeTab, setActiveTab] = useState('explorer');

        const [stats, setStats] = useState({ registered: 0, saved: 0 });

        const [savedIds, setSavedIds] = useState([]); // Fixed: Added missing state variable



        const fetchData = async () => {

            try {

                const [allRes, myRes, savedRes] = await Promise.all([

                    api.get('/events/approved'),

                    api.get('/events/my-registrations'),

                    api.get('/events/my-saved').catch(() => ({ data: [] }))

                ]);



                setEvents(allRes.data);

                setMyEvents(myRes.data.map(e => e.id));

               

                // Map saved event IDs for the heart icon logic

                const sIds = savedRes.data.map(e => e.id);

                setSavedIds(sIds);



                setStats({

                    registered: myRes.data.length,

                    saved: sIds.length

                });

            } catch (err) {

                toast.error("Failed to sync dashboard");

            } finally {

                setLoading(false);

            }

        };



        useEffect(() => {

            fetchData();

        }, []);



        // --- MILAP'S CORE LOGIC (RAZORPAY & REG) ---

        const loadRazorpayScript = () => {

            return new Promise((resolve) => {

                if (window.Razorpay) {

                    resolve(true);

                    return;

                }

                const script = document.createElement('script');

                script.src = 'https://checkout.razorpay.com/v1/checkout.js';

                script.onload = () => resolve(true);

                script.onerror = () => resolve(false);

                document.body.appendChild(script);

            });

        };



        const handleToggleSave = async (e, eventId) => {

            e.stopPropagation(); // Prevents clicking the card itself

            try {

                const res = await api.post('/events/toggle-save', { eventId });

                toast.success(res.data.message);

                // RE-FETCH DATA: Updates count and heart color

                fetchData();

            } catch (err) {

                toast.error("Could not save event");

            }

        };



        const handleRegister = async (event) => {

            setProcessingId(event.id);

            try {

                if (!event.is_paid_event) {

                    // FREE EVENT FLOW

                    const regRes = await api.post('/events/register', { eventId: event.id });

                    toast.success("Registration successful!");

                    const regData = regRes.data.data || regRes.data;

                    navigate('/view-ticket', {

                        state: {

                            registration: {

                                ...regData,

                                title: event.title,

                                event_date: event.event_date

                            }

                        }

                    });

                    return;

                }



                // PAID EVENT FLOW

                const res = await loadRazorpayScript();

                if (!res) return toast.error("Razorpay SDK failed to load");



                const initRes = await api.post('/events/user/init-payment', {

                    eventId: event.id,

                    ticket_price: event.ticket_price

                });



                const { orderId, amount, currency } = initRes.data;

                const options = {

                    key: import.meta.env.VITE_RAZORPAY_KEY,

                    amount,

                    currency,

                    name: event.organization_name,

                    description: `Ticket for ${event.title}`,

                    order_id: orderId,

                    handler: async (response) => {

                        const verifyRes = await api.post('/events/user/verify-payment', {

                            ...response,

                            eventId: event.id

                        });

                        toast.success("Payment verified!");

                        const verifyData = verifyRes.data.data || verifyRes.data;

                        navigate('/view-ticket', {

                            state: {

                                registration: {

                                    ...verifyData,

                                    title: event.title,

                                    event_date: event.event_date

                                }

                            }

                        });

                    },

                    theme: { color: "#47B599" }

                };

                const rzp = new window.Razorpay(options);

                rzp.open();

            } catch (err) {

                toast.error(err.response?.data?.message || "Registration failed");

            } finally {

                setProcessingId(null);

            }

        };



        const submitFeedback = async (eventId) => {

            try {

                await api.post(`/events/${eventId}/feedback`, {

                    event_id: eventId,

                    rating: Number(rating),

                    comment

                });

                toast.success("Feedback submitted!");

                setSubmittedFeedbacks(prev => [...prev, eventId]);

                setActiveFeedback(null);

            } catch (err) {

                toast.error("Failed to submit feedback.");

            }

        };



        const hasEventEnded = (endDatetime) => endDatetime && new Date() > new Date(endDatetime);



        if (loading) return <div className="db-container">Loading Dashboard...</div>;



        return (

            <div className="db-container" style={{ paddingTop: '10px' }}>

                {/* SAKSHI'S STATS SECTION */}

                <h2 className="db-title" style={{ marginTop: '0px' }}>Welcome Back!</h2>

                <div className="stats-grid">

                    <div className="stat-card">

                        <p className="stat-label">My Registrations</p>

                        <div className="stat-value">{stats.registered}</div>

                    </div>

                    <div className="stat-card">

                        <p className="stat-label">Saved Events</p>

                        <div className="stat-value">{stats.saved}</div>

                    </div>

                </div>



                {/* SAKSHI'S RIBBON TABS */}

                <div className="management-ribbon" style={{ marginTop: '40px' }}>

                    {[

            { id: 'explorer', label: '🌐 Event Explorer' },

            { id: 'bookings', label: '✅ My Bookings' },

            { id: 'wishlist', label: '❤️ Wishlist' },

            // { id: 'passes', label: '🎫 My Passes' } // NEW TAB

        ].map(tab => (

                        <div

                            key={tab.id}

                            className={`nav-card ${activeTab === tab.id ? 'active-state' : ''}`}

                            onClick={() => setActiveTab(tab.id)}

                        >

                            <span className="card-label">{tab.label}</span>

                        </div>

                    ))}

                </div>



                {/* MILAP'S EVENT GRID (Filtering based on tab) */}

                <div className="m-grid">

                    {events.filter(e => {

    if (activeTab === 'bookings' || activeTab === 'passes') return myEvents.includes(e.id);                    if (activeTab === 'wishlist') return savedIds.includes(e.id);

                       

                        return true;

                    }).map(event => {

                        const isRegistered = myEvents.map(String).includes(String(event.id));

                        const isEnded = hasEventEnded(event.end_datetime);

                        const isSaved = savedIds.includes(event.id);

                       

                        return (

                            <div key={event.id} className="m-card">

                                {/* --- HEART ICON BUTTON --- */}

                                <button

                                    className="m-heart-btn"

                                    onClick={(e) => handleToggleSave(e, event.id)}

                                    title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}

                                >

                                    <span className={isSaved ? "m-heart-red" : "m-heart-empty"}>

                                        {isSaved ? "❤️" : "♡"}

                                    </span>

                                </button>



                                <div className="m-cardBanner">

                                    <span className="m-orgBadge">{event.organization_name}</span>

                                    <span className={`m-priceTag ${event.is_paid_event ? 'm-paid' : 'm-free'}`}>

                                        {event.is_paid_event ? `₹${event.ticket_price}` : "Free"}

                                    </span>

                                </div>



                                <div className="m-cardBody">

                                    <h3 className="m-eventTitle">{event.title}</h3>

                                    <div className="m-detailsGrid">

                                        <div className="m-detailItem">📅 {new Date(event.event_date).toLocaleDateString()}</div>

                                        <div className="m-detailItem">📍 {event.location || 'TBA'}</div>

                                        <div className="m-detailItem">👥 Capacity: {event.capacity || 'Unlimited'}</div>

                                    </div>

                                   

                                   <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {/* 1. Details Button - Fixed on Top (Phase 3 UI) */}
    {/* <button 
        className="m-details-btn" 
        style={{ 
            width: '100%', 
            backgroundColor: '#f0fdfa', 
            borderColor: '#47B599', 
            color: '#115e59',
            padding: '12px',
            fontWeight: '700'
        }}
        onClick={() => navigate(`/event/${event.id}`)}
    >
        🔍 View Event Details
    </button> */}



                                        {!isEnded && (

                                            <button

                                                disabled={isRegistered || processingId === event.id}

                                                onClick={() => handleRegister(event)}

                                                className={isRegistered ? "m-doneBtn" : "m-regBtn"}

                                            >

                                                {processingId === event.id ? "Processing..." : isRegistered ? "✓ Registered" : "Register"}

                                            </button>

                                        )}

                                    </div>



                                    {isRegistered && isEnded && !submittedFeedbacks.includes(event.id) && (

                                        <button className="update-pill-btn" 
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                borderRadius: '10px', 
                                backgroundColor: '#fef3c7', // Light Amber BG
                                color: '#92400e',           // Dark Amber Text
                                border: '1px solid #f59e0b',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }} onClick={() => setActiveFeedback(event.id)}>

                                            Leave Review

                                        </button>

                                    )}

                                </div>

                            </div>

                        );

                    })}

                </div>



                {/* FEEDBACK MODAL (MILAP LOGIC) */}

                {activeFeedback && (

                    <div className="modal-overlay">

                        <div className="modal-content" style={{background: 'white', padding: '20px', borderRadius: '12px'}}>

                            <h3>Event Experience</h3>

                            <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="mgmt-input" />

                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="mgmt-input" rows="4" placeholder="Your comments..." />

                            <button onClick={() => submitFeedback(activeFeedback)} className="m-regBtn">Submit</button>

                            <button onClick={() => setActiveFeedback(null)} className="mgmt-cancel-btn" style={{marginTop:'10px'}}>Cancel</button>

                        </div>

                    </div>

                )}

            </div>

        );

    };



    export default UserDashboard;

