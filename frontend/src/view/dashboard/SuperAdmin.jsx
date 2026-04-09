// Frontend/src/view/dashboard/SuperAdmin.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SuperAdmin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrgs: 0,
    pendingEvents: 0,
    totalEvents: 0,
    totalRevenue: 0,
    totalRefunded: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // CRITICAL FIX: Calling /admin/stats directly
        // This relies on api.js baseURL: "http://localhost:5000/api"
        const response = await api.get('/admin/stats');
        
        if (response.data) {
          setStats({
            totalUsers: response.data.totalUsers || 0,
            totalOrgs: response.data.totalOrgs || 0,
            pendingEvents: response.data.pendingEvents || 0,
            totalEvents: response.data.totalEvents || 0,
            totalRevenue: response.data.totalRevenue || 0,
            totalRefunded: response.data.totalRefunded || 0
          });
        }
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        if (err.response?.status !== 401) {
          toast.error("Failed to update platform statistics");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '100px 40px', textAlign: 'center' }}>
        <h3 style={{ color: '#47B599', fontWeight: '600' }}>Fetching System Intelligence...</h3>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>System Intelligence Overview</h2>
      
      <div style={styles.statsGrid}>
        {/* Row 1: Platform Scale */}
        <div style={{...styles.statCard, borderTop: '4px solid #47B599'}}>
          <p style={styles.label}>Global Users</p>
          <h1 style={styles.statValue}>{stats.totalUsers}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #04befe'}}>
          <p style={styles.label}>Total Institutions</p>
          <h1 style={styles.statValue}>{stats.totalOrgs}</h1>
        </div>

        {/* Row 2: Financial Performance */}
        <div style={{...styles.statCard, borderTop: '4px solid #10b981', background: '#f0fdf4'}}>
          <p style={{...styles.label, color: '#15803d'}}>Platform Revenue</p>
          <h1 style={{...styles.statValue, color: '#15803d'}}>₹{stats.totalRevenue.toLocaleString()}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #ef4444', background: '#fef2f2'}}>
          <p style={{...styles.label, color: '#b91c1c'}}>Total Refunded</p>
          <h1 style={{...styles.statValue, color: '#b91c1c'}}>₹{stats.totalRefunded.toLocaleString()}</h1>
        </div>

        {/* Row 3: Event Lifecycle Management */}
        <div style={{...styles.statCard, borderTop: '4px solid #f59e0b'}}>
          <p style={styles.label}>Moderation Queue</p>
          <h1 style={styles.statValue}>{stats.pendingEvents}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #6366f1'}}>
          <p style={styles.label}>Total Events</p>
          <h1 style={styles.statValue}>{stats.totalEvents}</h1>
        </div>
      </div>

      <div style={styles.infoSection}>
        <div style={styles.logCard}>
          <h3 style={{color: '#1e293b', marginBottom: '15px', fontWeight: '700'}}>Platform Health Summary</h3>
          <p style={{color: '#64748b', fontSize: '14px', lineHeight: '1.6'}}>
            SOEMS is currently facilitating event management for <strong>{stats.totalOrgs}</strong> active institutions. 
            There are <strong>{stats.pendingEvents}</strong> items awaiting manual review in the moderation queue.
            <br /><br />
            Total Gross Platform Volume: <span style={{color: '#15803d', fontWeight: '800'}}>₹{(stats.totalRevenue + stats.totalRefunded).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', paddingBottom: '40px' },
  title: { color: '#47B599', marginBottom: '30px', fontWeight: '800', fontSize: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  label: { color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' },
  infoSection: { background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
  logCard: { width: '100%' }
};

export default SuperAdmin;