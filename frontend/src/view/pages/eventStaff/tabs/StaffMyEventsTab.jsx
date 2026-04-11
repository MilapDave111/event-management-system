import React, { useState } from 'react';

const StaffMyEventsTab = ({ events, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10">Loading your assignments...</div>;

  return (
    <div className="db-container">
      <div className="search-wrapper">
        <input 
          type="text" 
          placeholder="Search assigned events..." 
          className="mgmt-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="event-grid">
        {filteredEvents.map(event => (
          <div key={event.id} className="event-card">
            <div className={`status-badge status-${event.status?.toLowerCase() || 'approved'}`}>
              {event.status || 'ASSIGNED'}
            </div>
            <h3 className="event-title">{event.title}</h3>
            <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
            <p>📍 {event.location || 'Venue TBD'}</p>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <button 
                className="event-card-btn"
                 // Neutral color for view-only
                disabled
              >
                Role: Event Staff
              </button>
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && <p className="helper-text">No events assigned to you yet.</p>}
      </div>
    </div>
  );
};

export default StaffMyEventsTab;