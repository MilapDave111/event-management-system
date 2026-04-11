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

  // Logic: Only show events that are NOT soft-deleted
  // Updated filter in UpdateEventTab.jsx
const filteredEvents = allEvents.filter(event => {
  const isDeleted = event.deleted_at !== null;
  const isArchived = event.is_archived === true || event.status === 'archived'; // Add archive check
  
  if (isDeleted || isArchived) return false; // Hide if deleted or archived
  return filterStatus ? event.status === filterStatus : true;
});

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

  const handleSoftDelete = async () => {
    if (!window.confirm("Move this event to Trash?")) return;
    try {
      setIsSubmitting(true);
      await api.post('/events/lifecycle', { action: 'delete', eventId: selectedId });
      toast.success("Event moved to Trash");
      fetchEvents();
      setSelectedId('');
    } catch (err) {
      toast.error("Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this inside the UpdateEventTab component
const handleLifecycleAction = async (action) => {
  if (!selectedId) return;

  const confirmMessages = {
    archive: "Are you sure you want to archive this event? It will be moved to the Archive tab.",
    // You can add other actions here if needed
  };

  if (!window.confirm(confirmMessages[action] || `Are you sure you want to ${action} this event?`)) {
    return;
  }

  try {
    setIsSubmitting(true);
    // Matches the payload expected by your handleEventLifecycle controller
    await api.post('/events/lifecycle', { action, eventId: selectedId }); 
    
    toast.success(`Event ${action}ed successfully`);
    
    // Refresh the list to reflect that the event is now archived (and should be filtered out)
    fetchEvents(); 
    setSelectedId(''); // Reset selection to clear the form
  } catch (err) {
    console.error(`Lifecycle error (${action}):`, err);
    toast.error(err.response?.data?.message || `Failed to ${action} event`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="tab-wrapper">
      <div className="card-header">
        <h2>Refine Event Configuration</h2>
        <p>Choose an active event to edit details.</p>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Filter by Status</label>
          <select className="form-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setSelectedId(''); }}>
            <option value="">All Active</option>
            <option value="draft">Drafts</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="input-group">
          <label>Select Event</label>
          <select className="form-select" value={selectedId} onChange={(e) => handleSelect(e.target.value)}>
            <option value="">-- Choose an Event --</option>
            {filteredEvents.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {selectedId && (
        <form className="event-form" onSubmit={(e) => e.preventDefault()}>
          <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

          <div className="input-group">
            <label>Event Title</label>
            <input className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} disabled={isSubmitting} />
          </div>

          <div className="input-group">
            <label>Event Description</label>
            <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} disabled={isSubmitting} />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Event Type</label>
              <input className="form-input" value={formData.event_type} onChange={e => setFormData({ ...formData, event_type: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="input-group">
              <label>Event Subtype</label>
              <input className="form-input" value={formData.event_subtype} onChange={e => setFormData({ ...formData, event_subtype: e.target.value })} disabled={isSubmitting} />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Event Date</label>
              <input type="date" className="form-input" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} disabled={isSubmitting} />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} disabled={isSubmitting} />
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

         {/* --- Replace the button section at the bottom of UpdateEventTab.jsx --- */}
<div className="form-actions">
  <button 
    type="button" 
    className="submit-btn" 
    onClick={handleUpdate} 
    disabled={isSubmitting}
  >
    {isSubmitting ? "Updating..." : "Save Changes"}
  </button>

  <button
    type="button"
    className="archive-btn" // New specific class for Archive
    onClick={() => handleLifecycleAction('archive')}
    disabled={isSubmitting}
  >
    Archive
  </button>

  <button 
    type="button" 
    className="reject-btn" 
    onClick={handleSoftDelete} 
    disabled={isSubmitting}
  >
    Delete
  </button>
</div>
        </form>
      )}
    </div>
  );
};

export default UpdateEventTab;