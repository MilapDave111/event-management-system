import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import Sidebar from '../../layout/MainLayout'; 
import '../../styles/EventStaff.css';

const ManageStaff = () => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Fetch the table list where role = 'EVENT_STAFF'
// frontend/src/view/pages/eventManager/ManageStaff.jsx

const fetchStaffList = async () => {
  try {
    const res = await api.get('/events/list-staff');
    // Access res.data.data because of the wrapper in your controller
    const actualData = res.data.success ? res.data.data : res.data;
    setStaffList(Array.isArray(actualData) ? actualData : []);
  } catch (err) {
    console.error("Error fetching staff list:", err);
  }
};
  useEffect(() => { 
    fetchStaffList(); 
  }, []);

  // Search for users where role = 'USER'
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search.length > 1) {
        api.get(`/events/search-users?search=${search}`)
          .then(res => setSearchResults(res.data))
          .catch(err => console.error(err));
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Handle click on "Assign Staff" button
  const handleAssignStaff = async (userId) => {
    try {
      await api.post('/events/assign-staff', { userId });
      toast.success("Successfully assigned as Event Staff!");
      setSearch('');          // Clear search box
      setSearchResults([]);   // Hide dropdown
      fetchStaffList();       // Refresh the table
    } catch (err) {
      toast.error("Failed to assign staff");
    }
  };

  // Handle click on "Remove" button
  // const handleRemoveStaff = async (id) => {
  //   if (window.confirm("Are you sure? This will change their role back to a regular User.")) {
  //     try {
  //       await api.post(`/events/remove-staff/${id}`);
  //       toast.success("Removed from Staff and reverted to User.");
  //       fetchStaffList();     // Refresh the table
  //     } catch (err) {
  //       toast.error("Failed to remove staff");
  //     }
  //   }
  // };

const handleRemoveStaff = async (id) => {
  if (window.confirm("Revert this staff member to a regular user?")) {
    try {
      const response = await api.post(`/events/remove-staff/${id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh local UI
        fetchStaffList(); 
      }
    } catch (err) {
      toast.error("Action failed");
    }
  }
};
  return (
    <div className="manage-staff-page-container">
      

      <div className="manage-staff-main" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div className="manage-staff-header">
          <h2>Manage Staff</h2>
          <p>Search for regular users and assign them as Event Staff.</p>
        </div>

        {/* --- 1. SEARCH BOX & ASSIGN BUTTON --- */}
        <div className="manage-staff-card">
          <label className="search-label" style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#0fb8b1' }}>
            Search Staff
          </label>
          <div className="search-input-box">
            <input 
              type="text"
              placeholder="Type user's name to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.8rem', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
            
            {/* Display search results below input */}
            {searchResults.length > 0 && (
              <div className="search-dropdown">
                {searchResults.map(user => (
                  <div key={user.id} className="search-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>{user.full_name}</span>
                      <small style={{ color: '#666' }}>{user.email}</small>
                    </div>
                    {/* ASSIGN BUTTON */}
                    <button 
                      onClick={() => handleAssignStaff(user.id)} 
                      style={{ backgroundColor: '#0fb8b1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Assign Staff
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- 2. LIST OF STAFF TABLE --- */}
        <div className="manage-staff-table-card" style={{ marginTop: '2rem' }}>
          <h3>List of Staff</h3>
          <table className="staff-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length > 0 ? staffList.map(staff => (
                <tr key={staff.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{staff.full_name}</td>
                  <td style={{ padding: '1rem' }}>{staff.email}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {/* REMOVE BUTTON */}
                    <button 
                      onClick={() => handleRemoveStaff(staff.id)} 
                      style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No event staff found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ManageStaff;