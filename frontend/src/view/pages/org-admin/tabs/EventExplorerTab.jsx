import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/Dashboard.css';

const EventExplorerTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for search and filter logic
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/my-events');
        // Initial fetch: filter out deleted items based on model logic
        setEvents(res.data.filter(e => e.deleted_at === null));
      } catch (err) {
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Compute the filtered events based on current inputs
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? event.status.toLowerCase() === statusFilter.toLowerCase() : true;
    
    // Maintain your requirement to hide archived items unless explicitly filtered for 'archived'
    const isArchived = event.is_archived || event.status === 'archived';
    if (statusFilter === 'archived') return matchesSearch && isArchived;
    return matchesSearch && matchesStatus && !isArchived;
  });

  if (loading) return <div className="mgmt-card">Loading event cards...</div>;

  return (
    <div className="db-container">
      {/* Search and Filter Section */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <input 
          type="text" 
          placeholder="Search by event title..." 
          className="mgmt-input"
          style={{ flex: 2, marginBottom: 0 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="mgmt-input" 
          style={{ flex: 1, marginBottom: 0 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Event Grid - Map over filteredEvents instead of events */}
      <div className="event-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className="event-card">
            <div className={`status-badge status-${event.status.toLowerCase()}`} style={{ marginBottom: '10px' }}>
              {event.status}
            </div>
            <h3 className="event-title" style={{ color: '#1e293b', marginBottom: '8px' }}>{event.title}</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0' }}>
              📅 {new Date(event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0' }}>
              📍 {event.location || 'Venue Not Specified'}
            </p>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
              Capacity: {event.capacity || 'Unlimited'}
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && <p>No events found matching your search.</p>}
      </div>
    </div>
  );
};

export default EventExplorerTab;