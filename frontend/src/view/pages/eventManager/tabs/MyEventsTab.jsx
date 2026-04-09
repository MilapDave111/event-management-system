import React, { useState } from 'react';
import "../../../styles/Dashboard.css"; 

const MyEventsTab = ({ events, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    event.deleted_at === null
  );

  if (loading) return <div className="p-10">Loading your events...</div>;

  return (
    <div className="db-container">
      <div style={{ marginBottom: '20px' }}>
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
            <div className={`status-badge status-${event.status?.toLowerCase()}`}>
              {event.status}
            </div>
            <h3 className="event-title">{event.title}</h3>
            <p>📅 {new Date(event.event_date).toLocaleDateString()}</p>
            <p>📍 {event.location || 'Venue TBD'}</p>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <button 
                onClick={() => window.location.href=`/manager/tasks?eventId=${event.id}`}
                style={{
                  width: '100%', padding: '8px', backgroundColor: '#47B599',
                  color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Go to Task Assignment
              </button>
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && <p>No events assigned to you yet.</p>}
      </div>
    </div>
  );
};

export default MyEventsTab;