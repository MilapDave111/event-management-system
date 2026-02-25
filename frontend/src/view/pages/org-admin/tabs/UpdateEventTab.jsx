import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const UpdateEventTab = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', description: '', event_type: '', event_subtype: '',
    scope: 'CENTRAL', location: '', capacity: '', poster_url: '',
    event_date: '', start_time: '', end_time: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/my-events');
      setAllEvents(res.data);
    } catch (err) {
      toast.error("Failed to fetch events");
    }
  };

  const filteredEvents = allEvents.filter(event => 
    filterStatus ? event.status === filterStatus : true
  );

  const handleSelect = (id) => {
    if (!id) {
      setSelectedId('');
      return;
    }

    const event = allEvents.find(e => e.id === Number(id));
    if (event) {
      setSelectedId(id);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        event_subtype: event.event_subtype || '',
        scope: event.scope || 'CENTRAL',
        location: event.location || '',
        capacity: event.capacity || '',
        poster_url: event.poster_url || '',
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
        // Map backend TIMESTAMP to frontend time inputs
        start_time: event.start_datetime ? event.start_datetime.split(' ')[1]?.substring(0, 5) : '',
        end_time: event.end_datetime ? event.end_datetime.split(' ')[1]?.substring(0, 5) : ''
      });
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      const start_datetime = formData.start_time ? `${formData.event_date} ${formData.start_time}` : null;
      const end_datetime = formData.end_time ? `${formData.event_date} ${formData.end_time}` : null;

      const payload = {
        ...formData,
        start_datetime,
        end_datetime,
        status: allEvents.find(e => e.id === Number(selectedId))?.status || 'draft'
      };

      await api.put(`/events/${selectedId}`, payload);
      toast.success("Configuration updated successfully");
      fetchEvents(); 
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLifecycleAction = async (action) => {
  if (!window.confirm(`Are you sure you want to ${action} this event?`)) return;

  try {
    setIsSubmitting(true);
    // Matches the payload expected by your handleEventLifecycle controller
    await api.post('/events/lifecycle', { action, eventId: selectedId }); 
    toast.success(`Event ${action}ed successfully`);
    fetchEvents(); // Refresh list to reflect status change
    setSelectedId(''); // Close the form
  } catch (err) {
    toast.error(err.response?.data?.message || "Action failed");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="tab-wrapper">
      <div className="card-header">
        <h2>Refine Event Configuration</h2>
        <p>Choose an event to pre-fill and edit all details.</p>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Filter by Status</label>
          <select 
            className="form-select" 
            value={filterStatus} 
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedId('');
            }}
          >
            <option value="">All Events</option>
            <option value="draft">Drafts</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="input-group">
          <label>Select Event</label>
          <select 
            className="form-select" 
            value={selectedId} 
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- Choose an Event --</option>
            {filteredEvents.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedId && (
        <>
          <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />
          <form className="event-form" onSubmit={(e) => e.preventDefault()}>
            
            {/* 1. Basic Info */}
            <div className="input-group">
              <label>Event Title</label>
              <input className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} disabled={isSubmitting} />
            </div>

            <div className="input-group">
              <label>Event Description</label>
              <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} disabled={isSubmitting} />
            </div>

            {/* 2. Type & Subtype */}
            <div className="form-row">
              <div className="input-group">
                <label>Event Type</label>
                <input className="form-input" value={formData.event_type} onChange={e => setFormData({...formData, event_type: e.target.value})} disabled={isSubmitting} />
              </div>
              <div className="input-group">
                <label>Event Subtype</label>
                <input className="form-input" value={formData.event_subtype} onChange={e => setFormData({...formData, event_subtype: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            {/* 3. Scope */}
            <div className="input-group">
              <label>Event Scope</label>
              <select className="form-select" value={formData.scope} onChange={e => setFormData({ ...formData, scope: e.target.value })} disabled={isSubmitting}>
                <option value="CENTRAL">Central (For Everyone)</option>
                <option value="DEPARTMENT">Department Wise</option>
                <option value="CLUB">Club Wise</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            {/* 4. Date & Venue */}
            <div className="form-row">
              <div className="input-group">
                <label>Event Date</label>
                <input type="date" className="form-input" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} disabled={isSubmitting} />
              </div>
              <div className="input-group">
                <label>Venue / Location</label>
                <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            {/* 5. Time Management */}
            <div className="form-row">
              <div className="input-group">
                <label>Start Time</label>
                <input type="time" className="form-input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} disabled={isSubmitting} />
              </div>
              <div className="input-group">
                <label>End Time</label>
                <input type="time" className="form-input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            {/* 6. Capacity & Visuals */}
            <div className="form-row">
              <div className="input-group">
                <label>Capacity</label>
                <input type="number" className="form-input" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} disabled={isSubmitting} />
              </div>
              <div className="input-group">
                <label>Poster Image URL</label>
                <input className="form-input" value={formData.poster_url} onChange={e => setFormData({...formData, poster_url: e.target.value})} disabled={isSubmitting} />
              </div>
            </div>

            <button type="button" className="submit-btn" onClick={handleUpdate} disabled={isSubmitting} style={{ marginTop: '20px' }}>
              {isSubmitting ? "Updating..." : "Update Configuration"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default UpdateEventTab;