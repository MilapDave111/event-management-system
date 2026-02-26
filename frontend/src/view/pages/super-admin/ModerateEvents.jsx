import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast'; // FIX: Added missing import
import '../../styles/Management.css';
const ModerateEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const res = await api.get('/events/moderation');
      setEvents(res.data);
      setLoading(false);
    } catch (err) {
      // Logic: Ensure toast is available before calling
      if (typeof toast !== 'undefined') {
        toast.error("Failed to load moderation queue");
      }
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const handleModeration = async (eventId, status) => {
    let reason = "";
    if (status === 'rejected') {
      reason = window.prompt("Enter reason for rejection:");
      if (!reason) return;
    }

    try {
      await api.put('/events/moderate', { eventId, status, rejection_reason: reason });
      toast.success(`Event ${status} successfully`);
      loadEvents();
    } catch (err) {
      toast.error("Moderation failed");
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading Moderation Queue...</div>;

 return (
    <div className="mgmt-card">
      <h2 className="db-title">Event Moderation Queue</h2>
      <div style={{overflowX: 'auto'}}>
        <table className="mgmt-table">
          <thead>
            <tr>
              <th className="mgmt-th">Organization</th>
              <th className="mgmt-th">Event Title</th>
              <th className="mgmt-th">Date</th>
              <th className="mgmt-th">Status</th>
              <th className="mgmt-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td className="mgmt-td" style={{fontWeight: 'bold'}}>{event.organization_name || "N/A"}</td>
                <td className="mgmt-td">{event.title}</td>
                <td className="mgmt-td">{new Date(event.event_date).toLocaleDateString()}</td>
                <td className="mgmt-td">
                  <span className={`status-badge status-${event.status}`}>
                    {event.status}
                  </span>
                </td>
                <td className="mgmt-td">
                  {event.status === 'pending' && (
                    <div style={{display: 'flex', gap: '10px'}}>
                     <button 
  onClick={() => handleModeration(event.id, 'approved')} 
  className="approve-btn"
>
  Approve
</button>

<button 
  onClick={() => handleModeration(event.id, 'rejected')} 
  className="reject-btn"
>
  Reject
</button></div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// const styles = {
//   container: { width: '100%' },
//   title: { color: '#47B599', marginBottom: '25px', fontWeight: '800' },
//   card: { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   thRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
//   th: { padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '700' },
//   tr: { borderBottom: '1px solid #f1f5f9' },
//   td: { padding: '16px', fontSize: '14px' },
//   orgText: { fontWeight: '700', color: '#1e293b' },
//   badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
//   approveBtn: { background: '#47B599', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
//   rejectBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }
// };

export default ModerateEvents;