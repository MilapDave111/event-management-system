import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/EventStaff.css';

const EventStaffDashboard = () => {
  const [staffStats, setStaffStats] = useState({
    assigned_tasks: 0,
    completed_tasks: 0,
    attendance_scans: 0,
    incidents_reported: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/events/staff-stats'); 
        
        // Use res.data.data to access the standardized API payload
        if (res.data && res.data.success && res.data.data) {
            setStaffStats(res.data.data); 
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        toast.error("Failed to sync personal assignment data");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, []);

  if (loading) {
    return <div className="p-10 text-gray-500 font-semibold">Loading Execution Dashboard...</div>;
  }

  return (
    <div className="staff-container">
      
        
      <div className="staff-action-grid">
  <h2 className="staff-title">My Field Operations</h2>
  <button className="staff-action-btn btn-tasks">📋 View My Tasks</button>
  <button className="staff-action-btn btn-scan">📷 Scan QR Ticket</button>
  <button className="staff-action-btn btn-team">My Teams</button>
  <button className="staff-action-btn btn-incident">🚨 Report Incident</button>
</div>
<br /><br />
      
      <div className="staff-stats-grid">
        <div className="staff-stat-card purple-border">
          <p className="staff-stat-label">My Pending Tasks</p>
          <h1 className="staff-stat-value">{staffStats.assigned_tasks}</h1>
        </div>
        <div className="staff-stat-card blue-border">
          <p className="staff-stat-label">Tasks Completed</p>
          <h1 className="staff-stat-value">{staffStats.completed_tasks}</h1>
        </div>
        <div className="staff-stat-card green-border">
          <p className="staff-stat-label">Check-in Scans</p>
          <h1 className="staff-stat-value">{staffStats.attendance_scans}</h1>
        </div>
        <div className="staff-stat-card red-border">
          <p className="staff-stat-label">Incidents Reported</p>
          <h1 className="staff-stat-value">{staffStats.incidents_reported}</h1>
        </div>
      </div>

      
    </div>
  );
};

export default EventStaffDashboard;