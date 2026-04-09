import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const ArchiveTab = () => {
  const [archivedEvents, setArchivedEvents] = useState([]);

  const fetchArchive = async () => {
    try {
      const res = await api.get('/events/my-events');
      
      // Strict Filter: 
      // 1. Must be explicitly archived (is_archived is true)
      // 2. Must NOT be soft-deleted (deleted_at must be null)
      const filtered = res.data.filter(e => 
        e.is_archived === true && e.deleted_at === null
      );
      
      setArchivedEvents(filtered);
    } catch (err) {
      toast.error("Failed to load archives");
    }
  };

  useEffect(() => { 
    fetchArchive(); 
  }, []);

  const handleUnarchive = async (id) => {
    if (!window.confirm("Move this event back to Drafts?")) return;
    
    try {
      // Sends the request to your updated handleLifecycle service
      await api.post('/events/lifecycle', { action: 'unarchive', eventId: id });
      
      toast.success("Event moved back to Drafts");
      
      // Refresh the list: the event will now be hidden because is_archived is false
      fetchArchive(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unarchive event");
    }
  };

  return (
    <div className="mgmt-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#47B599', margin: 0 }}>📦 Event Archive</h3>
        <span style={{ fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px' }}>
          {archivedEvents.length} Archived Events
        </span>
      </div>

      <table className="mgmt-table">
        <thead>
          <tr>
            <th className="mgmt-th">Past Event</th>
            <th className="mgmt-th">Event Date</th>
            <th className="mgmt-th" style={{ textAlign: 'right' }}>Management</th>
          </tr>
        </thead>
        <tbody>
          {archivedEvents.map(e => (
            <tr key={e.id}>
              <td className="mgmt-td" style={{ fontWeight: '600' }}>{e.title}</td>
              <td className="mgmt-td">
                {new Date(e.event_date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </td>
              <td className="mgmt-td" style={{ textAlign: 'right' }}>
                <button 
                  onClick={() => handleUnarchive(e.id)} 
                  className="approve-btn"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  Unarchive
                </button>
              </td>
            </tr>
          ))}
          {archivedEvents.length === 0 && (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No archived events found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ArchiveTab;