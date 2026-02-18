import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '', location: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      toast.success("Event submitted successfully!");
      navigate('/dashboard/org-admin'); // Navigate back to the main overview
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div style={styles.pageCenter}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{color: '#47B599', margin: 0}}>Create New Event</h2>
          <p style={{color: '#64748b', marginTop: '8px'}}>Submit details for Super Admin approval.</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Event Title</label>
            <input 
              style={styles.input} 
              placeholder="e.g. Annual Cultural Fest" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Event Description</label>
            <textarea 
              style={styles.textarea} 
              placeholder="Provide a detailed overview of the event..." 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required 
            />
          </div>

          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Date</label>
              <input 
                type="date" 
                style={styles.input} 
                value={formData.event_date} 
                onChange={e => setFormData({...formData, event_date: e.target.value})} 
                required 
              />
            </div>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Venue Location</label>
              <input 
                style={styles.input} 
                placeholder="e.g. Main Ground" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                required 
              />
            </div>
          </div>

          <button type="submit" style={styles.btn}>Submit Proposal</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  pageCenter: { display: 'flex', justifyContent: 'center', padding: '20px 0' },
  card: { background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', width: '100%', maxWidth: '700px' },
  cardHeader: { marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  input: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', transition: '0.2s' },
  textarea: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '120px', outline: 'none', resize: 'vertical' },
  row: { display: 'flex', gap: '20px' },
  btn: { padding: '16px', background: 'linear-gradient(135deg, #47B599 0%, #3da188 100%)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(71, 181, 153, 0.3)' }
};

export default CreateEvent;