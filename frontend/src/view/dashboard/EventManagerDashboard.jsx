import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/EventManager.css'; 

const EventManagerDashboard = () => {
  const [managerStats, setManagerStats] = useState({
    total_registrations: 0,
    total_attendance: 0,
    pending_tasks: 0,
    live_checkins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/events/manager-stats'); 
        if (res.data && res.data.success) {
            setManagerStats(res.data.data); 
        }
      } catch (err) {
        toast.error("Event operational data sync failed");
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();
  }, []);

  if (loading) {
    return <div className="p-10">Loading Operational Head Dashboard...</div>;
  }

  return (
    <div className="manager-container">
      <h2 className="manager-title">Event Operational Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card teal-border">
          <p className="stat-label">Total Registrations</p>
          <h1 className="stat-value">{managerStats.total_registrations}</h1>
        </div>
        
        <div className="stat-card blue-border">
          <p className="stat-label">Live Check-ins</p>
          <h1 className="stat-value">{managerStats.live_checkins}</h1>
        </div>
        
        <div className="stat-card orange-border">
          <p className="stat-label">Pending Tasks</p>
          <h1 className="stat-value">{managerStats.pending_tasks}</h1>
        </div>
      </div>
      
      {/* Buttons removed from here as they are now in the Sidebar */}
    </div>
  );
};

export default EventManagerDashboard;