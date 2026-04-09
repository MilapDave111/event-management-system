import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';

const DraftsListTab = ({ onResume }) => {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    api.get('/events/my-events').then(res => {
      setDrafts(res.data.filter(e => e.status === 'draft'));
    });
  }, []);

 return (
    <div className="tab-wrapper">
      <div className="card-header"><h2>Your Drafts</h2></div>
      <table className="form-input" style={{ border: 'none', width: '100%' }}>
        <thead><tr style={{ textAlign: 'left' }}><th>Title</th><th>Actions</th></tr></thead>
        <tbody>
          {drafts.map(d => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>
                <button 
                  className="submit-btn" 
                  style={{ padding: '8px 15px', width: 'auto' }}
                  onClick={() => onResume(d.id)} // Trigger the resume logic
                >
                  Resume
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DraftsListTab;