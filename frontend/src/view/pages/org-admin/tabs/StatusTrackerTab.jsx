import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';

const StatusTrackerTab = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events/my-events').then(res => setEvents(res.data.filter(e => e.status !== 'draft')));
  }, []);

  return (
    <div className="tab-wrapper">
      <div className="card-header"><h2>Submission Status</h2></div>
      {events.map(e => (
        <div key={e.id} className="input-group" style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <strong>{e.title}</strong>
          <span style={{ color: e.status === 'approved' ? '#16a34a' : '#d97706' }}>Status: {e.status.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusTrackerTab;