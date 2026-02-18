
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/events/approved'),
        api.get('/events/my-registrations')
      ]);
      setEvents(allRes.data);
      setMyEvents(myRes.data.map(e => e.id));
    } catch (err) {
      toast.error("Failed to sync dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegister = async (eventId) => {
    try {
      await api.post('/events/register', { eventId });
      toast.success("Spot reserved!");
      fetchData(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  if (loading) return <div style={{padding: '20px'}}>Finding events for you...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Available Events</h2>
      <div style={styles.grid}>
        {events.map(event => (
          <div key={event.id} style={styles.card}>
            <div style={styles.badge}>{event.organization_name}</div>
            <h3 style={styles.eventTitle}>{event.title}</h3>
            <p style={styles.date}>📅 {new Date(event.event_date).toLocaleDateString()}</p>
            <p style={styles.location}>📍 {event.location}</p>
            
            <button 
              disabled={myEvents.includes(event.id)}
              onClick={() => handleRegister(event.id)}
              style={myEvents.includes(event.id) ? styles.doneBtn : styles.regBtn}
            >
              {myEvents.includes(event.id) ? "✓ Registered" : "Register Now"}
            </button>
          </div>
        ))}
      </div>
      {events.length === 0 && <p>No events available right now.</p>}
    </div>
  );
};

const styles = {
  container: { width: '100%' },
  title: { color: '#47B599', marginBottom: '30px', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' },
  badge: { fontSize: '10px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', color: '#64748b', fontWeight: 'bold', marginBottom: '15px', display: 'inline-block' },
  eventTitle: { margin: '0 0 10px 0', color: '#1e293b', fontSize: '18px' },
  date: { fontSize: '14px', color: '#64748b', margin: '5px 0' },
  location: { fontSize: '14px', color: '#64748b', marginBottom: '20px' },
  regBtn: { width: '100%', padding: '12px', background: '#47B599', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  doneBtn: { width: '100%', padding: '12px', background: '#f1f5f9', color: '#94a3b8', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'default' }
};

export default UserDashboard;

