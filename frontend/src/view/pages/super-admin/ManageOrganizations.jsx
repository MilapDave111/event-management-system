import React, { useState, useEffect } from 'react';
import api from '../../../services/api'; 
import toast from 'react-hot-toast';
import '../../styles/Management.css'; 

const ManageOrganizations = () => {
  const [orgs, setOrgs] = useState([]);
  const [editId, setEditId] = useState(null);
  // --- NEW STATES FOR SEARCH AND FILTER ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  const initialFormState = { 
    name: '', type: 'College', email: '', phone: '', 
    address: '', city: '', state: '', pincode: '', country: '' 
  };
  const [formData, setFormData] = useState(initialFormState);

  const loadOrgs = async () => {
    try {
      const res = await api.get('/organizations');
      setOrgs(res.data);
    } catch (err) {
      toast.error("Failed to load institutions");
    }
  };

  useEffect(() => { loadOrgs(); }, []);

  // --- UPDATED SEARCH & FILTER LOGIC ---
  const filteredOrgs = orgs.filter(o => {
    const matchesSearch = 
      o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || o.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editId) return; 

    try {
      await api.put(`/organizations/${editId}`, formData);
      toast.success("Institution updated successfully");
      
      setFormData(initialFormState);
      setEditId(null); 
      loadOrgs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this institution?")) {
      try {
        await api.delete(`/organizations/${id}`);
        toast.success("Deleted successfully");
        if (editId === id) {
          setEditId(null);
          setFormData(initialFormState);
        }
        loadOrgs();
      } catch (err) {
        console.error("Delete Error:", err);
        toast.error("Delete failed.");
      }
    }
  };

  // --- PERMANENT FIX FOR PRE-FILLING ---
  const handleEditInit = (org) => {
    setFormData({ 
      name: org.name || '', 
      type: org.type || 'College',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      pincode: org.pincode || '',
      country: org.country || ''
    });
    setEditId(org.id);
    // Ensure view stays at top when editing starts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

//   return (
//     <div className="db-container">
//       <h2 className="db-title">Manage Institutions</h2>

//       {/* --- NEW SEARCH AND FILTER UI --- */}
//       <div className="mgmt-card" style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
//         <input 
//           className="mgmt-input" 
//           placeholder="🔍 Search by Name, Email or City..." 
//           style={{ marginBottom: 0, flex: 2 }}
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <select 
//           className="mgmt-input" 
//           style={{ marginBottom: 0, flex: 1 }}
//           value={filterType}
//           onChange={(e) => setFilterType(e.target.value)}
//         >
//           <option value="All">All Types</option>
//           <option value="College">College</option>
//           <option value="University">University</option>
//           <option value="School">School</option>
//           <option value="Institute">Institute</option>
//           <option value="Other">Other</option>
//         </select>
//       </div>

//       <div className="mgmt-flex-container">
//         {editId && (
//           <form onSubmit={handleSubmit} className="mgmt-card" style={{ flex: 1, maxHeight: '85vh', overflowY: 'auto', textAlign: 'center' }}>
//             <h3 style={{marginBottom: '25px'}}>Edit Institution</h3>
            
//             <input className="mgmt-input" placeholder="Institution Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            
//             <select className="mgmt-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
//               <option value="College">College</option>
//               <option value="University">University</option>
//               <option value="School">School</option>
//               <option value="Institute">Institute</option>
//               <option value="Other">Other</option>
//             </select>

//             <input type="email" className="mgmt-input" placeholder="Official Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
//             <input type="tel" className="mgmt-input" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
//             <input type="text" className="mgmt-input" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            
//             <div style={{display: 'flex', gap: '15px'}}>
//               <input type="text" className="mgmt-input" placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required style={{flex: 1}} />
//               <input type="text" className="mgmt-input" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required style={{flex: 1}} />
//             </div>

//             <div style={{display: 'flex', gap: '15px'}}>
//               <input type="text" className="mgmt-input" placeholder="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required style={{flex: 1}} />
//               <input type="text" className="mgmt-input" placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required style={{flex: 1}} />
//             </div>

//             {/* --- UPDATED BUTTON UI TO PILL DESIGN --- */}
//             <button type="submit" className="update-pill-btn">
//               Update Institution
//             </button>
            
//             <button type="button" onClick={() => {setEditId(null); setFormData(initialFormState);}} className="mgmt-cancel-btn" style={{width: '100%', marginTop: '15px', background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: '#64748b'}}>
//               Cancel
//             </button>
//           </form>
//         )}

//         <div className="mgmt-card" style={{ flex: editId ? 2 : 1 }}>
//           <h3 style={{marginBottom: '15px', color: '#04befe'}}>Registered Institutions ({filteredOrgs.length})</h3>
//           <div style={{overflowX: 'auto'}}>
//             <table className="mgmt-table">
//               <thead>
//                 <tr>
//                   <th className="mgmt-th">Name</th>
//                   <th className="mgmt-th">Type</th>
//                   <th className="mgmt-th">Location</th>
//                   <th className="mgmt-th">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrgs.map(o => (
//                   <tr key={o.id}>
//                     <td className="mgmt-td">{o.name}</td>
//                     <td className="mgmt-td">{o.type}</td>
//                     <td className="mgmt-td">{o.city}, {o.country}</td>
//                     <td className="mgmt-td">
//                       <button onClick={() => handleEditInit(o)} className="mgmt-edit-link" style={{marginRight: '10px'}}>✎ Edit</button>
//                       <button onClick={() => handleDelete(o.id)} style={{color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold'}}>🗑 Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

/* ... logic and state remain identical ... */

return (
  <div className="db-container no-horizontal-scroll">
    <h2 className="db-title">Manage Institutions</h2>

    {/* Search & Filter - Stacking handled by CSS classes */}
    <div className="mgmt-card search-filter-container">
      <input 
        className="mgmt-input" 
        placeholder="🔍 Search by Name, Email or City..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select 
        className="mgmt-input" 
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
      >
        <option value="All">All Types</option>
        <option value="College">College</option>
        <option value="University">University</option>
        <option value="School">School</option>
        <option value="Institute">Institute</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div className="mgmt-flex-container">
      {editId && (
        <form onSubmit={handleSubmit} className="mgmt-card edit-form-lock">
          <h3 style={{marginBottom: '20px'}}>Edit Institution</h3>
          <input className="mgmt-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <select className="mgmt-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="College">College</option>
            <option value="University">University</option>
          </select>
          <input type="email" className="mgmt-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input type="tel" className="mgmt-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input type="text" className="mgmt-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
          
          <div className="form-row-stack">
            <input className="mgmt-input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
            <input className="mgmt-input" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
          </div>

          <button type="submit" className="update-pill-btn">Update Institution</button>
          <button type="button" onClick={() => {setEditId(null); setFormData(initialFormState);}} className="mgmt-cancel-btn full-width-btn">Cancel</button>
        </form>
      )}

      <div className={`mgmt-card table-section-lock ${editId ? 'is-split' : ''}`}>
        <h3 style={{marginBottom: '15px', color: '#04befe'}}>Registered Institutions ({filteredOrgs.length})</h3>
        
        {/* CORRECTED: The table is now INSIDE the scroll wrapper */}
        <div className="table-scroll-shield">
          <div className="responsive-table-wrapper">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th className="mgmt-th">Name</th>
                  <th className="mgmt-th">Type</th>
                  <th className="mgmt-th">Location</th>
                  <th className="mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(o => (
                  <tr key={o.id}>
                    <td className="mgmt-td">{o.name}</td>
                    <td className="mgmt-td">{o.type}</td>
                    <td className="mgmt-td">{o.city}, {o.country}</td>
                    <td className="mgmt-td">
                      <button onClick={() => handleEditInit(o)} className="mgmt-edit-link" style={{marginRight: '10px'}}>✎ Edit</button>
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
  </div>
);}

export default ManageOrganizations;