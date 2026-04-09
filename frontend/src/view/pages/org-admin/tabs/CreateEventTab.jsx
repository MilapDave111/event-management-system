import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';



const CreateEventTab = ({ resumeId, clearResume, loadEvents, setActiveTab }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgEventCount, setOrgEventCount] = useState(0); 
  const [platformFee, setPlatformFee] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    event_subtype: '',
    scope: 'CENTRAL',
    location: '',
    capacity: '',
    poster_url: '',
    event_date: '',
    start_time: '',
    end_time: '',
    is_paid_event: false, 
    ticket_price: ''      
  });

  // Dynamically load Razorpay SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch draft data and Organization usage stats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch actual stats from your backend to determine free tier eligibility
        const statsRes = await api.get(`/events/org-stats`);
        setOrgEventCount(parseInt(statsRes.data.total_events) || 0);

        if (resumeId) {
          const res = await api.get(`/events/my-events`); 
          const draft = res.data.find(e => e.id === resumeId);
          
          if (draft) {
            setFormData({
              title: draft.title || '',
              description: draft.description || '',
              event_type: draft.event_type || '',
              event_subtype: draft.event_subtype || '',
              scope: draft.scope || 'CENTRAL',
              location: draft.location || '',
              capacity: draft.capacity || '',
              poster_url: draft.poster_url || '',
              event_date: draft.event_date ? draft.event_date.split('T')[0] : '',
              start_time: draft.start_datetime ? draft.start_datetime.split(' ')[1] : '',
              end_time: draft.end_datetime ? draft.end_datetime.split(' ')[1] : '',
              is_paid_event: draft.is_paid_event || false,
              ticket_price: draft.ticket_price || ''
            });
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to load initial data. Check network connection.");
      }
    };
    fetchInitialData();
  }, [resumeId]);

  // Fee Calculation Logic (Frontend Estimate Only - Backend validates truth)
  useEffect(() => {
    let fee = 0;
    
    // Base fee applies after 3 events
    if (orgEventCount >= 3) {
      fee += 10000;
    }

    const capacityNum = Number(formData.capacity) || 0;
    const ticketPriceNum = Number(formData.ticket_price) || 0;

    // 5% platform fee if paid and capacity > 500
    if (formData.is_paid_event && capacityNum > 500) {
      const totalAmount = capacityNum * ticketPriceNum;
      fee += (totalAmount * 0.05); 
    }

    setPlatformFee(fee);
  }, [formData.capacity, formData.is_paid_event, formData.ticket_price, orgEventCount]);

  const resetFormAndNotify = async () => {
    setFormData({
      title: '', description: '', event_type: '', event_subtype: '',
      scope: 'CENTRAL', location: '', capacity: '', poster_url: '',
      event_date: '', start_time: '', end_time: '', is_paid_event: false, ticket_price: ''
    });
    if (typeof loadEvents === 'function') await loadEvents(); 
    if (typeof setActiveTab === 'function') setActiveTab('status'); 
  };

  const handleAction = async (targetStatus) => {
    if (!formData.title || !formData.event_date || !formData.location) {
      toast.error("Please fill in the Title, Date, and Venue");
      return;
    }

    if (formData.is_paid_event && !formData.ticket_price) {
      toast.error("Ticket price is required for paid events");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const start_datetime = formData.start_time ? `${formData.event_date} ${formData.start_time}` : null;
      const end_datetime = formData.end_time ? `${formData.event_date} ${formData.end_time}` : null;

      const payload = {
        ...formData,
        start_datetime, 
        end_datetime,
        status: targetStatus, 
        capacity: formData.capacity ? Number(formData.capacity) : null,
        ticket_price: formData.is_paid_event ? Number(formData.ticket_price) : 0,
        platform_fee_calculated: platformFee 
      };

      // --- PAYMENT INTERCEPTOR ---
      if (targetStatus === 'pending' && platformFee > 0) {
        if (!window.Razorpay) {
          toast.error("Payment gateway failed to load. Please check your connection.");
          setIsSubmitting(false);
          return;
        }

        toast.loading("Initializing secure payment...", { id: "init-pay" });
        
        // 1. Request backend to create an order
        const orderResponse = await api.post('/events/init-payment', payload);
        const { orderId, amount, eventId } = orderResponse.data;
        
        toast.dismiss("init-pay");

        // 2. Configure Razorpay options using Vite environment variable
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY, // Must be set in frontend .env
          amount: amount, 
          currency: "INR",
          name: "Smart Online Event Management",
          description: "Event Creation Platform Fee",
          order_id: orderId,
          handler: async function (response) {
            try {
              toast.loading("Verifying transaction...", { id: "verify-toast" });
              
              // 3. Verify signature on backend
              await api.post('/events/verify-payment', {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                eventId: eventId
              });
              
              toast.success("Payment verified! Event submitted for approval.", { id: "verify-toast" });
              if (clearResume) clearResume();
              resetFormAndNotify();
            } catch (verificationError) {
              toast.error("Payment verification failed. Please contact admin.", { id: "verify-toast" });
            }
          },
          theme: { color: "#47B599" }, // Maintained your color theme
          modal: {
            ondismiss: function() {
              toast.error("Payment cancelled by user.");
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          toast.error(`Payment Failed: ${response.error.description}`);
          setIsSubmitting(false);
        });

        rzp.open();
        return; // Halt regular execution, wait for Razorpay UI
      }

      // --- STANDARD FLOW (Free Events or Saving Drafts) ---
      if (resumeId) {
        await api.put(`/events/${resumeId}`, payload);
        toast.success(targetStatus === 'draft' ? "Draft Updated" : "Submitted for Approval");
        if (targetStatus !== 'draft' && clearResume) clearResume();
      } else {
        await api.post('/events', payload);
        toast.success(targetStatus === 'draft' ? "Saved to Drafts" : "Submitted for Approval");
      }
      
      if (targetStatus !== 'draft') resetFormAndNotify();

    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="tab-wrapper" style={{ maxWidth: '850px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div className="card-header" style={{ marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '700' }}>
          {resumeId ? "Resume Draft" : "Create New Event"}
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
          Configure your event details and manage the submission lifecycle.
        </p>
        
        <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderLeft: '4px solid #47B599', borderRadius: '4px', fontSize: '14px', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Organization Usage:</strong> {orgEventCount} events created to date.
          </div>
          <div>
            {orgEventCount < 3 
              ? <span style={{ color: '#166534', fontWeight: '600', background: '#dcfce7', padding: '4px 10px', borderRadius: '12px' }}>{3 - orgEventCount} Free Events Remaining</span> 
              : <span style={{ color: '#9a3412', fontWeight: '600', background: '#ffedd5', padding: '4px 10px', borderRadius: '12px' }}>Standard Tier Pricing Applies</span>}
          </div>
        </div>
      </div>

      <form className="event-form" onSubmit={(e) => e.preventDefault()}>
        
        {/* Section 1: Basic Details */}
        <div style={{ background: '#fff',width:'100%',  padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Basic Details</h3>
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Title <span style={{color: '#ef4444'}}>*</span></label>
            <input className="form-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required disabled={isSubmitting} placeholder="Enter official event name" />
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Description <span style={{color: '#ef4444'}}>*</span></label>
            <textarea className="form-textarea" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', minHeight: '100px', resize: 'vertical', outlineColor: '#47B599' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required disabled={isSubmitting} placeholder="Provide a comprehensive description..." />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Type</label>
              <input className="form-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} placeholder="e.g. Conference / Fest" value={formData.event_type} onChange={e => setFormData({ ...formData, event_type: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Subtype</label>
              <input className="form-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} placeholder="Optional subtype" value={formData.event_subtype} onChange={e => setFormData({ ...formData, event_subtype: e.target.value })} disabled={isSubmitting} />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Scope</label>
            <select className="form-select" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599', backgroundColor: '#fff' }} value={formData.scope} onChange={e => setFormData({ ...formData, scope: e.target.value })} disabled={isSubmitting}>
              <option value="CENTRAL">Central (For Everyone)</option>
              <option value="DEPARTMENT">Department Wise</option>
              <option value="CLUB">Club Wise</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
        </div>

        

        {/* Section 3: Logistics */}
        <div style={{ background: '#fff',width:'100%', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Date & Location</h3>
          
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Event Date <span style={{color: '#ef4444'}}>*</span></label>
              <input type="date" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required disabled={isSubmitting} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Venue / Link <span style={{color: '#ef4444'}}>*</span></label>
              <input style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required disabled={isSubmitting} placeholder="Physical room or meeting link" />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Start Time</label>
              <input type="time" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>End Time</label>
              <input type="time" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} disabled={isSubmitting} />
            </div>
          </div>

          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Poster Image URL</label>
            <input style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.poster_url} onChange={e => setFormData({ ...formData, poster_url: e.target.value })} disabled={isSubmitting} placeholder="https://..." />
          </div>
        </div>

        {/* Section 2: Pricing & Capacity (Highlighted) */}
        <div style={{ background: '#f8fafc',width:'100%', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Registration & Capacity</h3>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Pricing Strategy</label>
              <select style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599', backgroundColor: '#fff' }} value={formData.is_paid_event} onChange={e => setFormData({ ...formData, is_paid_event: e.target.value === 'true' })} disabled={isSubmitting}>
                <option value="false">Free Entry for Students</option>
                <option value="true">Paid Ticket for Students</option>
              </select>
            </div>
            {formData.is_paid_event && (
              <div className="input-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Ticket Price (₹) <span style={{color: '#ef4444'}}>*</span></label>
                <input type="number" min="0" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.ticket_price} onChange={e => setFormData({ ...formData, ticket_price: e.target.value })} required={formData.is_paid_event} disabled={isSubmitting} placeholder="0.00" />
              </div>
            )}
          </div>
          
          <div className="input-group">
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Maximum Student Capacity</label>
            <input type="number" min="1" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outlineColor: '#47B599' }} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} disabled={isSubmitting} placeholder="e.g., 500" />
            <span style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'block' }}>Note: For paid events exceeding 500 capacity, a 5% high-volume processing fee applies.</span>
          </div>
        </div>

        {/* Dynamic Platform Fee Banner */}
        <div style={{ padding: '20px',width:'100%', backgroundColor: platformFee > 0 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${platformFee > 0 ? '#fcd34d' : '#86efac'}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div>
            <strong style={{ display: 'block', color: '#1e293b', fontSize: '16px', marginBottom: '4px' }}>Calculated Platform Fee</strong>
            <span style={{ fontSize: '13px', color: '#475569' }}>Based on organization tier and event scale configuration.</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: platformFee > 0 ? '#b45309' : '#166534' }}>
            ₹ {platformFee.toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions" style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button 
            type="button" 
            onClick={() => handleAction('draft')} 
            disabled={isSubmitting} 
            style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '2px solid #47B599', color: '#47B599', background: '#fff', fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => { if(!isSubmitting) e.target.style.background = '#f0fdf4'; }}
            onMouseOut={(e) => { if(!isSubmitting) e.target.style.background = '#fff'; }}
          >
            {resumeId ? "Update Draft" : "Save as Draft"}
          </button>
          
          <button 
            type="button" 
            onClick={() => handleAction('pending')} 
            disabled={isSubmitting} 
            style={{ flex: 2, padding: '16px', borderRadius: '8px', background: isSubmitting ? '#94a3b8' : '#47B599', color: '#fff', border: 'none', fontSize: '16px', fontWeight: '700', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(71, 181, 153, 0.4)' }}
            onMouseOver={(e) => { if(!isSubmitting) e.target.style.background = '#3ca388'; }}
            onMouseOut={(e) => { if(!isSubmitting) e.target.style.background = '#47B599'; }}
          >
            {isSubmitting ? "Processing..." : (platformFee > 0 ? `Pay ₹${platformFee} & Submit Event` : "Submit for Approval (Free)")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventTab;