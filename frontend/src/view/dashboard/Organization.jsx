
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Organization = () => {
  const [stats, setStats] = useState({ total_events: 0, approved_events: 0, pending_events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/events/org-stats');
        setStats(res.data);
      } catch (err) {
        console.error("404 Error - Check backend routes:", err);
        toast.error("Could not load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{padding: '20px'}}>Syncing Institution Data...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Institution Overview</h2>
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderTop: '4px solid #47B599'}}>
          <p style={styles.label}>Total Events</p>
          <h1 style={styles.statValue}>{stats.total_events}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #04befe'}}>
          <p style={styles.label}>Approved</p>
          <h1 style={styles.statValue}>{stats.approved_events}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #f59e0b'}}>
          <p style={styles.label}>Pending</p>
          <h1 style={styles.statValue}>{stats.pending_events}</h1>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%' },
  title: { color: '#47B599', marginBottom: '25px', fontWeight: '800' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' },
  statCard: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  label: { color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: '32px', color: '#1e293b', marginTop: '10px' }
};

export default Organization;

