import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../styles/Management.css';
const ManageOrganizations = () => {
  const [orgs, setOrgs] = useState([]);
  const [formData, setFormData] = useState({ name: '', code: '', type: 'College' });
  const [editId, setEditId] = useState(null);

  const loadOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrgs(res.data);
    } catch (err) {
      toast.error("Failed to load institutions");
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/organizations/${editId}`, formData);
        toast.success("Institution updated");
      } else {
        await api.post('/organizations', formData);
        toast.success("Institution registered");
      }
      setFormData({ name: '', code: '', type: 'College' });
      setEditId(null);
      loadOrgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this institution?")) {
      try {
        await api.delete(`/organizations/${id}`);
        toast.success("Deleted successfully");
        loadOrgs();
      } catch (err) {
        console.error("Delete Error:", err);
        toast.error("Delete failed. Check backend console.");
      }
    }
  };

  const handleEditInit = (org) => {
    setEditId(org.id);
    setFormData({ name: org.name, code: org.code, type: org.type });
  };

 return (
    <div className="db-container">
      <h2 className="db-title">Manage Institutions</h2>
      <div className="mgmt-flex-container">
        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mgmt-card">
          <h3 style={{marginBottom: '15px'}}>{editId ? 'Edit Institution' : 'Add New Institution'}</h3>
          <input className="mgmt-input" placeholder="Organization Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input className="mgmt-input" placeholder="Code (e.g. ABC)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
          <select className="mgmt-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="College">College</option>
            <option value="Institute">Institute</option>
          </select>
          <button type="submit" className="mgmt-btn">{editId ? 'Update Institution' : 'Register'}</button>
          {editId && <button onClick={() => {setEditId(null); setFormData({name:'', code:'', type:'College'})}} className="mgmt-cancel-btn" style={{width: '100%', marginTop: '10px', background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer'}}>Cancel</button>}
        </form>

        {/* List Table */}
        <div className="mgmt-card" style={{ flex: 2 }}>
          <h3 style={{marginBottom: '15px', color: '#04befe'}}>Registered Institutions</h3>
          <div style={{overflowX: 'auto'}}>
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th className="mgmt-th">Name</th>
                  <th className="mgmt-th">Code</th>
                  <th className="mgmt-th">Type</th>
                  <th className="mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(o => (
                  <tr key={o.id}>
                    <td className="mgmt-td">{o.name}</td>
                    <td className="mgmt-td">{o.code}</td>
                    <td className="mgmt-td">{o.type}</td>
                    <td className="mgmt-td">
                      <button onClick={() => {setEditId(o.id); setFormData({name: o.name, code: o.code, type: o.type})}} style={{color: '#04befe', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px'}}>✎ Edit</button>
                      <button onClick={() => handleDelete(o.id)} style={{color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
     

// const styles = {
//   flex: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
//   card: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1 },
//   input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
//   btn: { width: '100%', padding: '12px', background: '#47B599', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
//   cancel: { width: '100%', marginTop: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
//   table: { width: '100%', borderCollapse: 'collapse' },
//   thRow: { background: '#f8fafc', textAlign: 'left' },
//   th: { padding: '12px', fontSize: '12px', color: '#64748b', fontWeight: '700' },
//   tr: { borderBottom: '1px solid #f1f5f9' },
//   td: { padding: '12px', fontSize: '14px', color: '#334155' },
//   editBtn: { marginRight: '15px', color: '#04befe', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' },
//   delBtn: { color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }
// };

export default ManageOrganizations;