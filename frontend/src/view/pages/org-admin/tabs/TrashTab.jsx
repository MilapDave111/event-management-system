import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import '../../../styles/Management.css';

const TrashTab = () => {
  const [trashEvents, setTrashEvents] = useState([]);

  const fetchTrash = async () => {
  try {
    // 1. Call the specific trash endpoint
    const res = await api.get('/events/trash');
    
    // 2. Data is already filtered by the backend
    setTrashEvents(Array.isArray(res.data) ? res.data : res.data.data || []);
  } catch (err) {
    toast.error("Failed to load trash");
  }
};

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id) => {
    try {
      // Matches the 'restore' action in your backend service
      await api.post('/events/lifecycle', { action: 'restore', eventId: id });
      toast.success("Event restored to drafts");
      fetchTrash();
    } catch (err) {
      toast.error("Restore failed");
    }
  };

  return (
    <div className="mgmt-card">
      <h3 style={{ color: '#ef4444', marginBottom: '20px' }}>🗑️ Event Trash</h3>
      <table className="mgmt-table">
        <thead>
          <tr>
            <th className="mgmt-th">Event Title</th>
            <th className="mgmt-th">Deleted On</th>
            <th className="mgmt-th" style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trashEvents.map(e => (
            <tr key={e.id}>
              <td className="mgmt-td">{e.title}</td>
              <td className="mgmt-td">{new Date(e.deleted_at).toLocaleDateString()}</td>
              <td className="mgmt-td" style={{ textAlign: 'right' }}>
                <button onClick={() => handleRestore(e.id)} className="approve-btn">
                  Restore to Drafts
                </button>
              </td>
            </tr>
          ))}
          {trashEvents.length === 0 && (
            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Trash is empty.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TrashTab;