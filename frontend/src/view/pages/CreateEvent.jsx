import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';

const CreateEvent = () => {
  const navigate = useNavigate();
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
    event_date: '', // Updated to match payload mapping
    start_time: '',
    end_time: ''
  });

  /**
   * handleAction processes the submission based on the target status
   * targetStatus: 'draft' or 'pending'
   */
  const handleAction = async (targetStatus) => {
    // Basic validation
    if (!formData.title || !formData.event_date) {
      toast.error("Title and Event Date are required");
      return;
    }

    try {
      setIsSubmitting(true);

      // Merge date + time into datetime format for PostgreSQL TIMESTAMPTZ
      const start_datetime = `${formData.event_date} ${formData.start_time || '00:00:00'}`;
      const end_datetime = `${formData.event_date} ${formData.end_time || '23:59:59'}`;

      const payload = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        start_datetime,
        end_datetime,
        event_type: formData.event_type,
        event_subtype: formData.event_subtype,
        scope: formData.scope,
        poster_url: formData.poster_url,
        status: targetStatus // Explicitly setting status for the service layer logic
      };

      await api.post('/events', payload);
      
      toast.success(targetStatus === 'draft' ? "Saved to Drafts" : "Submitted for Approval");
      navigate('/dashboard/org-admin');
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="event-card">
        <div className="card-header">
          <h2>Create New Event</h2>
          <p>Configure your event details and manage the submission lifecycle.</p>
        </div>

        <form className="event-form" onSubmit={(e) => e.preventDefault()}>
          {/* Basic Info */}
          <div className="input-group">
            <label>Event Title</label>
            <input
              className="form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label>Event Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Type & Subtype */}
          <div className="form-row">
            <div className="input-group">
              <label>Event Type</label>
              <input
                className="form-input"
                placeholder="e.g. Conference / Fest"
                value={formData.event_type}
                onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label>Event Subtype</label>
              <input
                className="form-input"
                placeholder="Optional subtype"
                value={formData.event_subtype}
                onChange={e => setFormData({ ...formData, event_subtype: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Event Scope</label>
            <select
              className="form-select"
              value={formData.scope}
              onChange={e => setFormData({ ...formData, scope: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="CENTRAL">Central (For Everyone)</option>
              <option value="DEPARTMENT">Department Wise</option>
              <option value="CLUB">Club Wise</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Date & Venue */}
          <div className="form-row">
            <div className="input-group">
              <label>Event Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label>Venue / Location</label>
              <input
                className="form-input"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Time Fields */}
          <div className="form-row">
            <div className="input-group">
              <label>Start Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label>End Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Optional Data */}
          <div className="form-row">
            <div className="input-group">
              <label>Capacity</label>
              <input
                type="number"
                className="form-input"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="input-group">
              <label>Poster Image URL</label>
              <input
                className="form-input"
                value={formData.poster_url}
                onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Dual Action Workflow Buttons */}
          <div className="form-actions" style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button
              type="button"
              className="btn-draft"
              onClick={() => handleAction('draft')}
              disabled={isSubmitting}
              style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #47B599', color: '#47B599', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="btn-submit"
              onClick={() => handleAction('pending')}
              disabled={isSubmitting}
              style={{ flex: 2, padding: '16px', borderRadius: '12px', background: '#47B599', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              {isSubmitting ? "Processing..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;