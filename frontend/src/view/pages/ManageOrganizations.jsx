import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

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
    <div>
      <h2 style={{color: '#47B599', marginBottom: '20px'}}>Manage Institutions</h2>
      <div style={styles.flex}>
        <form onSubmit={handleSubmit} style={styles.card}>
          <h3 style={{marginBottom: '15px'}}>{editId ? 'Edit Institution' : 'Add New Institution'}</h3>
          <input style={styles.input} placeholder="Organization Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input style={styles.input} placeholder="Code (e.g. ABC)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
          <select style={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="College">College</option>
            <option value="Institute">Institute</option>
          </select>
          <button type="submit" style={styles.btn}>{editId ? 'Update Institution' : 'Register'}</button>
          {editId && <button onClick={() => {setEditId(null); setFormData({name:'', code:'', type:'College'})}} style={styles.cancel}>Cancel Edit</button>}
        </form>

        <div style={{...styles.card, flex: 2}}>
          <h3 style={{marginBottom: '15px', color: '#04befe'}}>Registered Institutions</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map(o => (
                <tr key={o.id} style={styles.tr}>
                  <td style={styles.td}>{o.name}</td>
                  <td style={styles.td}>{o.code}</td>
                  <td style={styles.td}>{o.type}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleEditInit(o)} style={styles.editBtn}>✎ Edit</button>
                    <button onClick={() => handleDelete(o.id)} style={styles.delBtn}>🗑 Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  flex: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  card: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flex: 1 },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
  btn: { width: '100%', padding: '12px', background: '#47B599', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  cancel: { width: '100%', marginTop: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px', fontSize: '12px', color: '#64748b', fontWeight: '700' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', fontSize: '14px', color: '#334155' },
  editBtn: { marginRight: '15px', color: '#04befe', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' },
  delBtn: { color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600' }
};

export default ManageOrganizations;