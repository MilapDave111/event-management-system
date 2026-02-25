import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast'; // FIX: Added missing import

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
    <div style={styles.container}>
      <h2 style={styles.title}>Event Moderation Queue</h2>
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Organization</th>
              <th style={styles.th}>Event Title</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id} style={styles.tr}>
                <td style={styles.td}>
                  {/* Logic: Displaying organization_name from the SQL JOIN */}
                  <span style={styles.orgText}>{event.organization_name || "N/A"}</span>
                </td>
                <td style={styles.td}>{event.title}</td>
                <td style={styles.td}>{new Date(event.event_date).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge, 
                    background: event.status === 'approved' ? '#f0fdf4' : event.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                    color: event.status === 'approved' ? '#16a34a' : event.status === 'rejected' ? '#dc2626' : '#d97706'
                  }}>
                    {event.status.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>
                  {event.status === 'pending' && (
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={() => handleModeration(event.id, 'approved')} style={styles.approveBtn}>Approve</button>
                      <button onClick={() => handleModeration(event.id, 'rejected')} style={styles.rejectBtn}>Reject</button>
                    </div>
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

const styles = {
  container: { width: '100%' },
  title: { color: '#47B599', marginBottom: '25px', fontWeight: '800' },
  card: { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
  th: { padding: '16px', fontSize: '12px', color: '#64748b', fontWeight: '700' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px', fontSize: '14px' },
  orgText: { fontWeight: '700', color: '#1e293b' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  approveBtn: { background: '#47B599', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  rejectBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }
};

export default ModerateEvents;