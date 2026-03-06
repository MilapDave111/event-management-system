
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SuperAdmin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrgs: 0,
    pendingEvents: 0,
    totalEvents: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetching data across modules for global analytics
       const [uRes, oRes, eRes] = await Promise.all([
  api.get('/users'),
  api.get('/organizations'),
  api.get('/events/admin/all') // --- MILAP'S ROUTE ---
]);

        setStats({
          totalUsers: uRes.data.length,
          totalOrgs: oRes.data.length,
          pendingEvents: eRes.data.filter(ev => ev.status === 'pending').length,
          totalEvents: eRes.data.length
        });
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        toast.error("Failed to update system stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>System Intelligence Overview</h2>
      
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderTop: '4px solid #47B599'}}>
          <p style={styles.label}>Global Users</p>
          <h1 style={styles.statValue}>{stats.totalUsers}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #04befe'}}>
          <p style={styles.label}>Total Institutions</p>
          <h1 style={styles.statValue}>{stats.totalOrgs}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #f59e0b'}}>
          <p style={styles.label}>Moderation Queue</p>
          <h1 style={styles.statValue}>{stats.pendingEvents}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #10b981'}}>
          <p style={styles.label}>Events Live</p>
          <h1 style={styles.statValue}>{stats.totalEvents}</h1>
        </div>
      </div>

      <div style={styles.infoSection}>
        <div style={styles.logCard}>
          <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Platform Health</h3>
          <p style={{color: '#64748b', fontSize: '14px'}}>
            System is monitoring {stats.totalOrgs} institutions. 
            Current moderation workload: {stats.pendingEvents} pending reviews.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%' },
  title: { color: '#47B599', marginBottom: '30px', fontWeight: '800' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  label: { color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: '32px', color: '#1e293b', marginTop: '10px' },
  infoSection: { background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
};

export default SuperAdmin;

