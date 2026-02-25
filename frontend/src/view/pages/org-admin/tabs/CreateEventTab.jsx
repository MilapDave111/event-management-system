import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const CreateEventTab = ({ resumeId, clearResume }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    end_time: ''
  });

  // Fetch draft data when resumeId is provided
  useEffect(() => {
    if (resumeId) {
      const fetchDraftData = async () => {
        try {
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
              // Handle potential date-time formatting issues
              event_date: draft.event_date ? draft.event_date.split('T')[0] : '',
              start_time: draft.start_datetime ? draft.start_datetime.split(' ')[1] : '',
              end_time: draft.end_datetime ? draft.end_datetime.split(' ')[1] : ''
            });
          }
        } catch (err) {
          toast.error("Failed to load draft data");
        }
      };
      fetchDraftData();
    }
  }, [resumeId]);

const handleAction = async (targetStatus) => {
    // Basic validation for required fields
    if (!formData.title || !formData.event_date || !formData.location) {
      toast.error("Please fill in the Title, Date, and Venue");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Merge date and time strings for backend TIMESTAMP consistency
      const start_datetime = formData.start_time ? `${formData.event_date} ${formData.start_time}` : null;
      const end_datetime = formData.end_time ? `${formData.event_date} ${formData.end_time}` : null;

      // Construct the payload
      // targetStatus is placed AFTER ...formData to ensure it overrides any existing 'status' in the state
      const payload = {
        ...formData,
        start_datetime, 
        end_datetime,
        status: targetStatus, 
        capacity: formData.capacity ? Number(formData.capacity) : null,
      };

      if (resumeId) {
        // Use PUT to update the existing draft record in the database
        await api.put(`/events/${resumeId}`, payload);
        
        // Success feedback based on the action taken
        toast.success(targetStatus === 'draft' ? "Draft Updated" : "Submitted for Approval");
        
        // If the event is submitted for approval, clear the resume state in the Hub
        if (targetStatus !== 'draft' && clearResume) {
          clearResume();
        }
      } else {
        // Use POST to create a brand new event record
        await api.post('/events', payload);
        toast.success(targetStatus === 'draft' ? "Saved to Drafts" : "Submitted for Approval");
      }
      
      // Reset the form fields only if the event was submitted (status: 'pending')
      if (targetStatus !== 'draft') {
        setFormData({
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
          end_time: ''
        });
      }
    } catch (err) {
      // Provide specific error message from server if available
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tab-wrapper">
      <div className="card-header">
        {/* Reusing existing Form.css header styles */}
        <h2>{resumeId ? "Resume Draft" : "Create New Event"}</h2>
        <p>Configure your event details and manage the submission lifecycle.</p>
      </div>

      <form className="event-form" onSubmit={(e) => e.preventDefault()}>
        <div className="input-group">
          <label>Event Title</label>
          <input className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required disabled={isSubmitting} />
        </div>

        <div className="input-group">
          <label>Event Description</label>
          <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required disabled={isSubmitting} />
        </div>

        {/* Reusing responsive grid from Form.css */}
        <div className="form-row">
          <div className="input-group">
            <label>Event Type</label>
            <input className="form-input" placeholder="e.g. Conference / Fest" value={formData.event_type} onChange={e => setFormData({ ...formData, event_type: e.target.value })} disabled={isSubmitting} />
          </div>
          <div className="input-group">
            <label>Event Subtype</label>
            <input className="form-input" placeholder="Optional subtype" value={formData.event_subtype} onChange={e => setFormData({ ...formData, event_subtype: e.target.value })} disabled={isSubmitting} />
          </div>
        </div>

        <div className="input-group">
          <label>Event Scope</label>
          <select className="form-select" value={formData.scope} onChange={e => setFormData({ ...formData, scope: e.target.value })} disabled={isSubmitting}>
            <option value="CENTRAL">Central (For Everyone)</option>
            <option value="DEPARTMENT">Department Wise</option>
            <option value="CLUB">Club Wise</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Event Date</label>
            <input type="date" className="form-input" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required disabled={isSubmitting} />
          </div>
          <div className="input-group">
            <label>Venue / Location</label>
            <input className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} required disabled={isSubmitting} />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Start Time</label>
            <input type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} disabled={isSubmitting} />
          </div>
          <div className="input-group">
            <label>End Time</label>
            <input type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} disabled={isSubmitting} />
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Capacity</label>
            <input type="number" className="form-input" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} disabled={isSubmitting} />
          </div>
          <div className="input-group">
            <label>Poster Image URL</label>
            <input className="form-input" value={formData.poster_url} onChange={e => setFormData({ ...formData, poster_url: e.target.value })} disabled={isSubmitting} />
          </div>
        </div>

        <div className="form-actions" style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <button type="button" className="btn-draft" onClick={() => handleAction('draft')} disabled={isSubmitting} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #47B599', color: '#47B599', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}>
            {resumeId ? "Update Draft" : "Save as Draft"}
          </button>
          <button type="button" className="btn-submit" onClick={() => handleAction('pending')} disabled={isSubmitting} style={{ flex: 2, padding: '16px', borderRadius: '12px', background: '#47B599', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            {isSubmitting ? "Processing..." : "Submit for Approval"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventTab;