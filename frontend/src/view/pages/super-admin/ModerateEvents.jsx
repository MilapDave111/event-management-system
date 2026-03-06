import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../styles/Management.css';

const ModerateEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- START OF MILAP'S MERGED CODE (State) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // --- END OF MILAP'S MERGED CODE ---

  // Updated loadEvents to use useCallback and handle query params
  const loadEvents = useCallback(async () => {
    try {
      // Logic: Using the new admin route that supports search/filter parameters
      const res = await api.get('/events/admin/all', {
        params: { search: searchTerm, status: statusFilter }
      });
      setEvents(res.data);
      setLoading(false);
    } catch (err) {
      if (typeof toast !== 'undefined') {
        toast.error("Failed to load moderation queue");
      }
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Logic: Debounce effect to prevent spamming the backend
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadEvents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadEvents]);

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
      {/* --- START OF MILAP'S MERGED CODE (Header UI) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 className="db-title" style={{ margin: 0 }}>Event Moderation Queue</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            className="mgmt-input" 
            style={{ width: '220px', marginBottom: 0 }}
            placeholder="Search event title..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <select 
            className="mgmt-input" 
            style={{ width: '140px', marginBottom: 0 }}
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="draft">Drafts</option>
  <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      {/* --- END OF MILAP'S MERGED CODE --- */}

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
            {events.length > 0 ? events.map(event => (
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
                      <button onClick={() => handleModeration(event.id, 'approved')} className="approve-btn">Approve</button>
                      <button onClick={() => handleModeration(event.id, 'rejected')} className="reject-btn">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No events found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModerateEvents;