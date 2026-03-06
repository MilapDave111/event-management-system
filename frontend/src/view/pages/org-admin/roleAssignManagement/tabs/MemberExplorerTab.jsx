import React, { useState, useEffect } from 'react';
// Adjust the path to your api service if needed (usually 4 or 5 levels up to src/services/api)
import api from '../../../../../services/api'; 

const MemberExplorerTab = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventRoles = async () => {
      try {
        const res = await api.get('/events/my-events');
        // Filter out deleted events
        setEvents(res.data.filter(e => e.deleted_at === null));
      } catch (err) {
        console.error("Failed to load roles", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventRoles();
  }, []);

  return (
    <div className="mgmt-card">
      <h3 style={{ color: '#47B599', marginBottom: '20px' }}>Current Assignments</h3>
      
      {loading ? (
        <p>Loading assignments...</p>
      ) : (
        <table className="mgmt-table">
          <thead>
            <tr>
              <th className="mgmt-th">Event Title</th>
              <th className="mgmt-th">Date</th>
              <th className="mgmt-th">Manager Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td className="mgmt-td" style={{ fontWeight: '600' }}>{e.title}</td>
                <td className="mgmt-td">{new Date(e.event_date).toLocaleDateString()}</td>
                <td className="mgmt-td">
                  {e.event_manager_name ? (
                    <span className="status-badge status-approved">👤 {e.event_manager_name}</span>
                  ) : (
                    <span className="status-badge status-pending">Not Assigned</span>
                  )}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MemberExplorerTab;