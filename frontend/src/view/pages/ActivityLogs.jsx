// frontend/src/view/pages/ActivityLogs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/Management.css';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/logs', {
        params: { search: searchTerm, action: filterAction }
      });
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load activity logs");
      setLoading(false);
    }
  }, [searchTerm, filterAction]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => fetchLogs(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchLogs]);

  // COLOR LOGIC HELPER
const getBadgeClass = (action) => {
  const act = action.toUpperCase();
  
  // 1. RED: Deletions, Trash, or Rejections
  if (act.includes('DELETE') || act.includes('TRASH') || act.includes('REJECT') || act.includes('REMOVE')) {
    return 'status-rejected';
  }
  
  // 2. GREEN: Create, Register, or Adding new entities
  if (act.includes('CREATE') || act.includes('REGISTER') || act.includes('ADD')) {
    return 'status-approved';
  }
  
  // 3. BLUE: General updates and status changes (Using status-blue)
  if (act.includes('UPDATE') || act.includes('MODERATE') || act.includes('ASSIGN')) {
    return 'status-blue';
  } if (act.includes('LIFECYCLE') || act.includes('PENDING')) {
    return 'status-pending';
  }
  
  // 4. GREY: Lifecycle, Archive, and Draft states
  if (act.includes('ARCHIVE') || act.includes('DRAFT')  ) {
    return 'status-draft';
  }
  
  return 'status-draft'; // Default fallback to Grey
};
  return (
    <div className="mgmt-card">
      <div className="mgmt-filter-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#04befe', margin: 0 }}>System Audit Trail</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input className="mgmt-input" style={{ width: '250px', marginBottom: 0 }} placeholder="Search name or details..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="mgmt-input" style={{ width: '200px', marginBottom: 0 }} value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            <option value="UPDATE_USER_ROLE">Role Updates</option>
            <option value="DELETE_USER">User Deletions</option>
            <option value="CREATE_EVENT">Event Creations</option>
            <option value="UPDATE_SETTING">Setting Changes</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="mgmt-table">
          <thead>
            <tr>
              <th className="mgmt-th">Timestamp</th>
              <th className="mgmt-th">Name</th>
              <th className="mgmt-th">Role</th>
              <th className="mgmt-th">Action</th>
              <th className="mgmt-th">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map(log => (
              <tr key={log.id}>
                <td className="mgmt-td" style={{ fontSize: '11px' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td className="mgmt-td"><strong>{log.admin_name}</strong></td>
                <td className="mgmt-td"><span className="type-subtext">{log.admin_role?.replace('_', ' ')}</span></td>
                <td className="mgmt-td">
                  <span className={`status-badge ${getBadgeClass(log.action_type)}`} style={{ fontSize: '10px' }}>
                    {log.action_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="mgmt-td" style={{ color: '#64748b', fontSize: '13px' }}>
                  {/* Logic: Replace numeric IDs with the target name in the description */}
                  {log.details.replace(/ID:?\s?\d+/, log.target_name || 'System')}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;