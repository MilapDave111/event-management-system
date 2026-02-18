import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    try {
      const [uRes, oRes] = await Promise.all([api.get('/users'), api.get('/organizations')]);
      setUsers(uRes.data);
      setOrgs(oRes.data);
    } catch (err) {
      toast.error("Failed to load user data");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdate = async (userId, role, organizationId) => {
    try {
      await api.put('/users/update-role', { userId, role, organizationId });
      toast.success("User updated successfully");
      loadData();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      try {
        await api.delete(`/users/${id}`);
        toast.success("User removed from system");
        loadData();
      } catch (err) {
        toast.error("Delete failed");
      }
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={{color: '#04befe'}}>System User Management</h3>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          style={isEditing ? styles.btnActive : styles.btnEdit}
        >
          {isEditing ? '✔ Finish Editing' : '✎ Edit Roles & Orgs'}
        </button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thRow}>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Organization</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={styles.tr}>
              <td style={styles.td}>{u.full_name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>
                {isEditing && u.role !== 'SUPER_ADMIN' ? (
                  <select 
                    value={u.role} 
                    style={styles.select} 
                    onChange={(e) => handleUpdate(u.id, e.target.value, u.organization_id)}
                  >
                    <option value="USER">USER</option>
                    <option value="ORG_ADMIN">ORG_ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                ) : (
                  <span style={styles.badge}>{u.role}</span>
                )}
              </td>
              <td style={styles.td}>
                {isEditing && u.role !== 'SUPER_ADMIN' ? (
                  <select 
                    value={u.organization_id || ''} 
                    style={styles.select} 
                    onChange={(e) => handleUpdate(u.id, u.role, e.target.value)}
                  >
                    <option value="">N/A</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                ) : (
                  u.organization_name || 'N/A'
                )}
              </td>
              <td style={styles.td}>
                {u.role !== 'SUPER_ADMIN' ? (
                  <button onClick={() => handleDelete(u.id)} style={styles.delBtn}>🗑 Delete</button>
                ) : (
                  <span style={{color: '#94a3b8', fontSize: '11px', fontWeight: 'bold'}}>SYSTEM PROTECTED</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  card: { background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '12px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', fontSize: '14px', color: '#334155' },
  badge: { background: '#f0fdfa', color: '#47B599', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  select: { padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' },
  btnEdit: { padding: '8px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  btnActive: { padding: '8px 16px', background: '#47B599', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  delBtn: { color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }
};

export default ManageUsers;