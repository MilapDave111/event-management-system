import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [activeFeedback, setActiveFeedback] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState([]);

  // Inside your component function:
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/events/approved'),
        api.get('/events/my-registrations')
      ]);
      setEvents(allRes.data);
      setMyEvents(myRes.data.map(e => e.id));
    } catch (err) {
      toast.error("Failed to sync dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Dynamically load Razorpay SDK
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

  const handleRegister = async (event) => {
    setProcessingId(event.id);
    
    try {
      if (!event.is_paid_event) {
        // FREE EVENT FLOW
        const regRes = await api.post('/events/register', { eventId: event.id });
        toast.success("Spot reserved successfully! Redirecting to ticket...");
        
        // CRITICAL FIX: Merge event title and date into registration object
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
      if (!res) {
        toast.error("Razorpay SDK failed to load. Check your connection.");
        setProcessingId(null);
        return;
      }
  
      // 1. Initialize Order on Backend
      const initRes = await api.post('/events/user/init-payment', { 
        eventId: event.id,
        ticket_price: event.ticket_price 
      });
  
      const { orderId, amount, currency } = initRes.data;
  
      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, // Ensure this is in your frontend .env
        amount: amount,
        currency: currency,
        name: event.organization_name,
        description: `Ticket for ${event.title}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment and Create Registration on Backend
            const verifyRes = await api.post('/events/user/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              eventId: event.id
            });
            
            toast.success("Payment successful! Redirecting to ticket...");
            
            // CRITICAL FIX: Merge event title and date into registration object
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
            
          } catch (verifyErr) {
            console.error("Verification Error:", verifyErr);
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setProcessingId(null);
          }
        },
        prefill: {
          name: "Student", // Pass actual user details if available
          email: "student@example.com",
        },
        theme: { color: "#47B599" }
      };
  
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        toast.error(response.error.description || "Payment failed");
        setProcessingId(null);
      });
      
      paymentObject.open();
  
    } catch (err) {
      console.error("Registration Error:", err);
      toast.error(err.response?.data?.message || "Registration failed");
      setProcessingId(null);
    }
  };

  const handleRatingChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setRating('');
      return;
    }
    if (val > 5) val = 5;
    if (val < 1) val = 1;
    setRating(val);
  };

  const submitFeedback = async (eventId) => {
    if (!comment.trim() || rating === '' || rating < 1 || rating > 5) {
      toast.error("Provide a valid rating (1-5) and comment.");
      return;
    }

    try {
      await api.post(`/events/${eventId}/feedback`, {
        event_id: eventId,
        rating: Number(rating),
        comment: comment
      });
      toast.success("Feedback submitted!");
      setSubmittedFeedbacks(prev => [...prev, eventId]);
      setActiveFeedback(null);
    } catch (err) {
      if (err.response?.data?.error === "You have already submitted feedback for this event.") {
        setSubmittedFeedbacks(prev => [...prev, eventId]);
      }
      toast.error(err.response?.data?.error || "Failed to submit feedback.");
    }
  };

  const hasEventEnded = (endDatetime) => {
    if (!endDatetime) return false;
    return new Date() > new Date(endDatetime);
  };

  if (loading) return (
    <div style={{...styles.container, textAlign: 'center', paddingTop: '50px'}}>
      <h3 style={{color: '#47B599'}}>Discovering Events...</h3>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <h2 style={styles.title}>Event Discovery</h2>
        <p style={styles.subtitle}>Find and register for upcoming institutional events.</p>
      </div>

      <div style={styles.grid}>
        {events.map(event => {
          const isRegistered = myEvents.map(String).includes(String(event.id));
          const isEnded = hasEventEnded(event.end_datetime);
          
          return (
            <div key={event.id} style={styles.card}>
              {/* Image Placeholder / Banner */}
              <div style={styles.cardBanner}>
                <span style={styles.orgBadge}>{event.organization_name}</span>
                {event.is_paid_event ? (
                  <span style={styles.priceTagPaid}>₹{event.ticket_price}</span>
                ) : (
                  <span style={styles.priceTagFree}>Free</span>
                )}
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.eventTitle}>{event.title}</h3>
                
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>📅</span>
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>📍</span>
                    <span>{event.location || 'TBA'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.icon}>👥</span>
                    <span>Capacity: {event.capacity || 'Unlimited'}</span>
                  </div>
                </div>
                
                {!isEnded && (
                  <button 
                    disabled={isRegistered || processingId === event.id}
                    onClick={() => handleRegister(event)}
                    style={{
                      ...(isRegistered ? styles.doneBtn : styles.regBtn),
                      opacity: processingId === event.id ? 0.7 : 1
                    }}
                  >
                    {processingId === event.id ? "Processing..." : 
                     isRegistered ? "✓ Registered" : 
                     event.is_paid_event ? `Pay ₹${event.ticket_price} to Register` : "Register for Free"}
                  </button>
                )}

                {isRegistered && isEnded && (
                  <div style={{ marginTop: '15px' }}>
                    {!submittedFeedbacks.includes(event.id) ? (
                      <button
                        onClick={() => {
                          setActiveFeedback(event.id);
                          setRating(5);
                          setComment('');
                        }}
                        style={styles.feedbackToggleBtn}
                      >
                        Leave Review
                      </button>
                    ) : (
                      <div style={styles.successBadge}>✓ Review Submitted</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {activeFeedback && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>Event Experience</h3>
            
            <label style={styles.label}>Rating (1-5)</label>
            <input type="number" value={rating} onChange={handleRatingChange} style={styles.input} />
            
            <label style={styles.label}>Feedback</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              style={styles.textarea}
            ></textarea>

            <div style={styles.modalActions}>
              <button onClick={() => setActiveFeedback(null)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => submitFeedback(activeFeedback)} style={styles.submitFeedbackBtn}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div style={styles.emptyState}>
          <p>No upcoming events available at the moment.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', paddingBottom: '40px' },
  headerArea: { marginBottom: '30px' },
  title: { color: '#1e293b', margin: '0 0 8px 0', fontWeight: '800', fontSize: '28px' },
  subtitle: { color: '#64748b', margin: 0, fontSize: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  card: { background: '#fff', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' },
  cardBanner: { height: '120px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', position: 'relative', padding: '15px' },
  orgBadge: { position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,255,255,0.9)', color: '#0f172a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  priceTagPaid: { position: 'absolute', bottom: '-15px', right: '20px', background: '#10b981', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', border: '3px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  priceTagFree: { position: 'absolute', bottom: '-15px', right: '20px', background: '#47B599', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', border: '3px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardBody: { padding: '30px 20px 20px 20px', display: 'flex', flexDirection: 'column', flexGrow: 1 },
  eventTitle: { margin: '0 0 15px 0', color: '#0f172a', fontSize: '20px', fontWeight: '700', lineHeight: '1.3' },
  detailsGrid: { display: 'grid', gap: '10px', marginBottom: '25px' },
  detailItem: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' },
  icon: { fontSize: '16px' },
  regBtn: { width: '100%', padding: '14px', background: '#47B599', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s', marginTop: 'auto' },
  doneBtn: { width: '100%', padding: '14px', background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'not-allowed', marginTop: 'auto' },
  feedbackToggleBtn: { width: '100%', padding: '12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  successBadge: { width: '100%', padding: '12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '10px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  modalContent: { background: '#fff', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '8px' },
  input: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '15px' },
  textarea: { width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', resize: 'vertical', minHeight: '100px', fontSize: '15px' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  submitFeedbackBtn: { padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }
};

export default UserDashboard;