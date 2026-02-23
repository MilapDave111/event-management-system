import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import '../styles/Form.css';
const CreateEvent = () => {
  const navigate = useNavigate();

 const [formData, setFormData] = useState({
  title: '',
  description: '',
  event_type: '',
  event_subtype: '',
  scope: 'CENTRAL',
  location: '',
  capacity: '',
  poster_url: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: ''
});

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Merge date + time into datetime
      const start_datetime = `${formData.event_date} ${formData.start_time || '00:00:00'}`;
      const end_datetime = `${formData.event_date} ${formData.end_time || '23:59:59'}`;

      const payload = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        start_datetime,
        end_datetime,
        event_type: formData.event_type,
        event_subtype: formData.event_subtype,
        scope: formData.scope,
        poster_url: formData.poster_url
      };

      await api.post('/events', payload);
      toast.success("Event submitted successfully!");
      navigate('/dashboard/org-admin');
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  // return (
  //   <div style={styles.pageCenter}>
  //     <div style={styles.card}>
  //       <div style={styles.cardHeader}>
  //         <h2 style={{ color: '#47B599', margin: 0 }}>Create New Event</h2>
  //         <p style={{ color: '#64748b', marginTop: '8px' }}>
  //           Submit details for Super Admin approval.
  //         </p>
  //       </div>

  //       <form onSubmit={handleSubmit} style={styles.form}>

  //         {/* Basic Info */}
  //         <div style={styles.inputGroup}>
  //           <label style={styles.label}>Event Title</label>
  //           <input
  //             style={styles.input}
  //             value={formData.title}
  //             onChange={e => setFormData({ ...formData, title: e.target.value })}
  //             required
  //           />
  //         </div>

  //         <div style={styles.inputGroup}>
  //           <label style={styles.label}>Event Description</label>
  //           <textarea
  //             style={styles.textarea}
  //             value={formData.description}
  //             onChange={e => setFormData({ ...formData, description: e.target.value })}
  //             required
  //           />
  //         </div>

  //         {/* Type & Scope */}
  //         <div style={styles.row}>
  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Event Type</label>
  //             <input
  //               style={styles.input}
  //               placeholder="e.g. Conference / Fest / Hackathon"
  //               value={formData.event_type}
  //               onChange={e => setFormData({ ...formData, event_type: e.target.value })}
  //             />
  //           </div>

  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Event Subtype</label>
  //             <input
  //               style={styles.input}
  //               placeholder="Optional subtype"
  //               value={formData.event_subtype}
  //               onChange={e => setFormData({ ...formData, event_subtype: e.target.value })}
  //             />
  //           </div>
  //         </div>

  //         <div style={styles.inputGroup}>
  //           <label style={styles.label}>Event Scope</label>
  //           <select
  //             style={styles.input}
  //             value={formData.scope}
  //             onChange={e => setFormData({ ...formData, scope: e.target.value })}
  //           >
  //             <option value="CENTRAL">Central (For Everyone)</option>
  //             <option value="DEPARTMENT">Department Wise</option>
  //             <option value="CLUB">Club Wise</option>
  //             <option value="CUSTOM">Custom</option>
  //           </select>
  //         </div>

  //         {/* Date & Time */}
  //         <div style={styles.row}>
  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Event Date</label>
  //             <input
  //               type="date"
  //               style={styles.input}
  //               value={formData.event_date}
  //               onChange={e => setFormData({ ...formData, event_date: e.target.value })}
  //               required
  //             />
  //           </div>

  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Venue</label>
  //             <input
  //               style={styles.input}
  //               value={formData.location}
  //               onChange={e => setFormData({ ...formData, location: e.target.value })}
  //               required
  //             />
  //           </div>
  //         </div>

  //         <div style={styles.row}>
  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Start Time</label>
  //             <input
  //               type="time"
  //               style={styles.input}
  //               value={formData.start_time}
  //               onChange={e => setFormData({ ...formData, start_time: e.target.value })}
  //             />
  //           </div>

  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>End Time</label>
  //             <input
  //               type="time"
  //               style={styles.input}
  //               value={formData.end_time}
  //               onChange={e => setFormData({ ...formData, end_time: e.target.value })}
  //             />
  //           </div>
  //         </div>

  //         {/* Optional Fields */}
  //         <div style={styles.row}>
  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Capacity (Optional)</label>
  //             <input
  //               type="number"
  //               style={styles.input}
  //               value={formData.capacity}
  //               onChange={e => setFormData({ ...formData, capacity: e.target.value })}
  //             />
  //           </div>

  //           <div style={{ ...styles.inputGroup, flex: 1 }}>
  //             <label style={styles.label}>Poster URL (Optional)</label>
  //             <input
  //               style={styles.input}
  //               value={formData.poster_url}
  //               onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
  //             />
  //           </div>
  //         </div>

  //         <button type="submit" style={styles.btn}>
  //           Submit Proposal
  //         </button>

  //       </form>
  //     </div>
  //   </div>
  // );



  return (
    <div className="page-container">
      <div className="event-card">
        <div className="card-header">
          <h2>Create New Event</h2>
          <p>Submit details for Super Admin approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="event-form">

          {/* Basic Info */}
          <div className="input-group">
            <label>Event Title</label>
            <input
              className="form-input"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="input-group">
            <label>Event Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Type & Subtype */}
          <div className="form-row">
            <div className="input-group">
              <label>Event Type</label>
              <input
                className="form-input"
                placeholder="e.g. Conference / Fest / Hackathon"
                value={formData.event_type}
                onChange={e => setFormData({ ...formData, event_type: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Event Subtype</label>
              <input
                className="form-input"
                placeholder="Optional subtype"
                value={formData.event_subtype}
                onChange={e => setFormData({ ...formData, event_subtype: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Event Scope</label>
            <select
              className="form-select"
              value={formData.scope}
              onChange={e => setFormData({ ...formData, scope: e.target.value })}
            >
              <option value="CENTRAL">Central (For Everyone)</option>
              <option value="DEPARTMENT">Department Wise</option>
              <option value="CLUB">Club Wise</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Date & Venue */}
          <div className="form-row">
            <div className="input-group">
              <label>Event Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Venue</label>
              <input
                className="form-input"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Time Fields */}
          <div className="form-row">
            <div className="input-group">
              <label>Start Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.start_time}
                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>End Time</label>
              <input
                type="time"
                className="form-input"
                value={formData.end_time}
                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="form-row">
            <div className="input-group">
              <label>Capacity (Optional)</label>
              <input
                type="number"
                className="form-input"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Poster URL (Optional)</label>
              <input
                className="form-input"
                value={formData.poster_url}
                onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Submit Proposal
          </button>

        </form>
      </div>
    </div>
  );
};


// const styles = {
//   pageCenter: {
//     display: 'flex',
//     justifyContent: 'center',
//     padding: '18px 0'
//   },

//   card: {
//     background: '#fff',
//     padding: '30px',
//     borderRadius: '24px',
//     boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
//     width: '100%',
//     maxWidth: '950px'
//   },

//   cardHeader: {
//     marginBottom: '40px',
//     borderBottom: '1px solid #f1f5f9',
//     paddingBottom: '20px'
//   },

//   form: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '32px'
//   },

//   inputGroup: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '10px',
//     width: '100%'
//   },

//   label: {
//     fontSize: '13px',
//     fontWeight: '700',
//     color: '#334155',
//     letterSpacing: '0.5px'
//   },

//   input: {
//     width: '100%',
//     padding: '14px 16px',
//     borderRadius: '10px',
//     border: '1px solid #e2e8f0',
//     fontSize: '14px',
//     outline: 'none'
//   },

//   textarea: {
//     width: '100%',
//     padding: '14px 16px',
//     borderRadius: '10px',
//     border: '1px solid #e2e8f0',
//     minHeight: '130px',
//     fontSize: '14px',
//     resize: 'vertical',
//     outline: 'none'
//   },

//   row: {
//     display: 'grid',
//     gridTemplateColumns: '1fr 1fr',
//     gap: '30px',
//     width: '100%'
//   },

//   btn: {
//     marginTop: '10px',
//     padding: '16px',
//     background: 'linear-gradient(135deg, #47B599 0%, #3da188 100%)',
//     color: '#fff',
//     border: 'none',
//     borderRadius: '12px',
//     cursor: 'pointer',
//     fontWeight: '600',
//     fontSize: '15px',
//     width: '100%'
//   }
// };


export default CreateEvent;
