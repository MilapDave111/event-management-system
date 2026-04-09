import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../styles/Management.css';

const ModerateEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadEvents = useCallback(async () => {
    try {
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadEvents();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadEvents]);

  const handleModeration = async (eventId, status) => {
    let reason = "";
    if (status === 'rejected') {
      reason = window.prompt("Enter reason for rejection and refund:");
      if (!reason) return; // Abort if admin cancels the prompt
    }

    try {
      await api.put('/events/moderate', { eventId, status, rejection_reason: reason });
      toast.success(`Event rejected and refund initiated successfully`);
      loadEvents();
    } catch (err) {
      toast.error("Moderation or refund failed");
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Loading Moderation Queue...</div>;

  return (
    <div className="db-container no-horizontal-scroll">
      <h2 className="db-title">Event Moderation Queue</h2>

      <div className="mgmt-card search-filter-container">
        <div className="search-input-group">
          <input 
            className="mgmt-input" 
            placeholder="🔍 Search event title..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-select-group">
          <select 
            className="mgmt-input" 
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

      <div className="mgmt-card table-section-lock">
        <div className="responsive-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th className="mgmt-th">Organization</th>
                <th className="mgmt-th">Event Title</th>
                <th className="mgmt-th">Date</th>
                <th className="mgmt-th">Type</th>
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
                  <td className="mgmt-td" style={{fontWeight: '600', color: event.is_paid_event ? '#10b981' : '#64748b'}}>
                    {event.is_paid_event ? 'Paid' : 'Free'}
                  </td>
                  <td className="mgmt-td">
                    <span className={`status-badge status-${event.status}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="mgmt-td">
                    {/* Render button for both pending and live/approved events to allow retroactive rejection/refunds */}
                    {(event.status === 'pending' || event.status === 'approved') && (
                      <div className="action-btns-flex">
                        <button 
                          onClick={() => handleModeration(event.id, 'rejected')} 
                          className="reject-btn"
                          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Reject & Refund
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No events found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModerateEvents;