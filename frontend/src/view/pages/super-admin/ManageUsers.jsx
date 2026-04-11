import React, { useState, useEffect ,useCallback  } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import '../../styles/Management.css';
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
const availableRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'EVENT_MANAGER', 'EVENT_STAFF', 'USER'];
  
  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/users', {
        params: { search: searchTerm, role: filterRole }
      });
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    }
  }, [searchTerm, filterRole]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadUsers]);

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

//  return (
//     <div className="mgmt-card">
//       <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
//         <h3 style={{color: '#04befe', margin: 0}}>System User Management</h3>
//         {/* --- START OF MILAP'S CODE (Search Bar) --- */}
//         <div style={{display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end'}}>
//           <input
//             className="mgmt-input"
//             style={{width: '250px', marginBottom: 0}}
//             placeholder="Search name or email..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <select
//             className="mgmt-input"
//             style={{width: '150px', marginBottom: 0}}
//             value={filterRole}
//             onChange={(e) => setFilterRole(e.target.value)}
//           >
//             <option value="">All Roles</option>
//             {availableRoles.map(role => (
//               <option key={role} value={role}>{role.replace('_', ' ')}</option>
//             ))}
//           </select>
//         </div>
//         {/* --- END OF MILAP'S CODE --- */}
//         <button 
//           onClick={() => setIsEditing(!isEditing)} 
//           className="mgmt-btn" 
//           style={{width: 'auto', padding: '8px 20px', background: isEditing ? '#47B599' : '#f1f5f9', color: isEditing ? '#fff' : '#64748b'}}
//         >
//           {isEditing ? '✔ Finish Editing' : '✎ Edit Roles & Orgs'}
//         </button>
//       </div>
//       <div style={{overflowX: 'auto'}}>
//         <table className="mgmt-table">
//           <thead>
//             <tr>
//               <th className="mgmt-th">Name</th>
//               <th className="mgmt-th">Email</th>
//               <th className="mgmt-th">Role</th>
//               <th className="mgmt-th">Organization</th>
//               <th className="mgmt-th">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((u) => (
//               <tr key={u.id}>
//                 <td className="mgmt-td">{u.full_name}</td>
//                 <td className="mgmt-td">{u.email}</td>
//                 <td className="mgmt-td">
//                   {isEditing && u.role !== 'SUPER_ADMIN' ? (
//                     <select className="mgmt-input" style={{padding: '5px', marginBottom: 0}} value={u.role} onChange={(e) => handleUpdate(u.id, e.target.value, u.organization_id)}>
//                       <option value="USER">USER</option>
//                       <option value="ORG_ADMIN">ORG_ADMIN</option>
//                       <option value="EVENT_STAFF">Event Staff</option>
//   <option value="EVENT_MANAGER">Event Manager</option>
//                     </select>
//                   ) : (
//                     <span className="status-badge status-approved">{u.role}</span>
//                   )}
//                 </td>
//                 <td className="mgmt-td">{u.organization_name || 'N/A'}</td>
//                 <td className="mgmt-td">
//                     {u.role !== 'SUPER_ADMIN' ? (
//                         <td className="mgmt-td">
//     {u.role !== 'SUPER_ADMIN' ? (
//         <button 
//           onClick={() => handleDelete(u.id)} // Added the missing click handler
//           style={{color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}
//         >
//           🗑 Delete
//         </button>
//     ) : (
//         <span style={{color: '#94a3b8', fontSize: '11px', fontWeight: 'bold'}}>SYSTEM PROTECTED</span>
//     )}
// </td>
//                     ) : (
//                         <span style={{color: '#94a3b8', fontSize: '11px', fontWeight: 'bold'}}>SYSTEM PROTECTED</span>
//                     )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

return (
    <div className="db-container no-horizontal-scroll">
      <h2 className="db-title">System User Management</h2>

      {/* --- CONSISTENT SEARCH, FILTER & ACTION BAR --- */}
      <div className="mgmt-card search-filter-container">
        <div className="search-input-group">
          <input
            className="mgmt-input"
            placeholder="🔍 Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select-group">
          <select
            className="mgmt-input"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="action-btn-group">
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="mgmt-btn" 
            style={{ 
              width: '100%', 
              background: isEditing ? '#47B599' : '#f1f5f9', 
              color: isEditing ? '#fff' : '#64748b' 
            }}
          >
            {isEditing ? '✔ Finish' : '✎ Edit Roles'}
          </button>
        </div>
      </div>

      <div className="mgmt-card table-section-lock">
        {/* --- NO-SCROLL TABLE SHIELD --- */}
        <div className="responsive-table-wrapper">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th className="mgmt-th">Name</th>
                <th className="mgmt-th">Email</th>
                <th className="mgmt-th">Role</th>
                <th className="mgmt-th">Organization</th>
                <th className="mgmt-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mgmt-td" style={{fontWeight: 'bold'}}>{u.full_name}</td>
                  <td className="mgmt-td">{u.email}</td>
                  <td className="mgmt-td">
                    {isEditing && u.role !== 'SUPER_ADMIN' ? (
                      <select 
                        className="mgmt-input" 
                        style={{ padding: '5px', marginBottom: 0, minWidth: '120px' }} 
                        value={u.role} 
                        onChange={(e) => handleUpdate(u.id, e.target.value, u.organization_id)}
                      >
                        <option value="USER">USER</option>
                        <option value="ORG_ADMIN">ORG_ADMIN</option>
                        <option value="EVENT_STAFF">Event Staff</option>
                        <option value="EVENT_MANAGER">Event Manager</option>
                      </select>
                    ) : (
                      <span className="status-badge status-approved">{u.role}</span>
                    )}
                  </td>
                  <td className="mgmt-td">{u.organization_name || 'N/A'}</td>
                  <td className="mgmt-td">
                    {u.role !== 'SUPER_ADMIN' ? (
                      <button 
                        onClick={() => handleDelete(u.id)} 
                        className="mgmt-delete-btn"
                      >
                        🗑 Delete
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>SYSTEM PROTECTED</span>
                    )}
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

export default ManageUsers;