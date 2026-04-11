import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';



const ManageStaff = () => {
  const [activeTab, setActiveTab] = useState('onboarding'); 

  // --- STATES ---
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null); 
  const [eventSearchTerm, setEventSearchTerm] = useState(''); 
  const [activeSubTab, setActiveSubTab] = useState('team'); 

  const [selectedSubTeam, setSelectedSubTeam] = useState(null);
  const [isSubmittingSubTeam, setIsSubmittingSubTeam] = useState(false);
  const [subTeamForm, setSubTeamForm] = useState({ team_name: '', description: '' });
  const [subTeamsList, setSubTeamsList] = useState([]);

  // --- FETCHING ---
// --- FETCHING ---
  useEffect(() => { 
    fetchStaffList(); 
    fetchTeamData();
  }, []);

  // Debounced user search
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

  // Unified Sub-Team Fetcher with Safety Check
  const fetchSubTeams = async (eventId) => {
    if (!eventId || eventId === "undefined") return; // Safety check
    try {
      const res = await api.get(`/events/${eventId}/sub-teams`);
      setSubTeamsList(res.data);
    } catch (err) {
      console.error("Fetch Sub Teams Error:", err);
    }
  };

  // Re-fetch when tab switches or team changes
  useEffect(() => {
    if ((activeSubTab === 'view-subteam' || activeSubTab === 'team') && selectedTeam?.event_id) {
      fetchSubTeams(selectedTeam.event_id);
    }
  }, [activeSubTab, selectedTeam]);

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/events/list-staff');
      const actualData = res.data.success ? res.data.data : res.data;
      setStaffList(Array.isArray(actualData) ? actualData : []);
    } catch (err) {
      console.error("Error fetching staff list:", err);
    }
  };

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/events/event-team');
      const data = res.data.success ? res.data.data : res.data;
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  // --- TEAM LOGIC ---
const getGroupedTeams = () => {
    const groups = {};
    if (!teamMembers || teamMembers.length === 0) return [];

    teamMembers.forEach(member => {
      const eventName = member.event_title || "Unknown Event"; 
      
      // Ensure we capture a valid ID for the member
      const memberId = member.user_id || member.id || member.staff_id;

      if (!groups[eventName]) {
        groups[eventName] = {
          event_title: eventName, 
          event_id: member.event_id, 
          manager_name: member.manager_name, 
          staff_count: 0, 
          members: []
        };
      }
      
      groups[eventName].staff_count += 1;
      
      // We push the member object but explicitly ensure user_id is attached
      groups[eventName].members.push({
          ...member,
          user_id: memberId 
      });
    });
    return Object.values(groups);
  };
  const filteredTeams = getGroupedTeams().filter(t => t.event_title.toLowerCase().includes(eventSearchTerm.toLowerCase()));

  // --- HANDLERS ---
  const handleAssignStaff = async (userId) => {
    try {
      await api.post('/events/assign-staff', { userId });
      toast.success("Successfully assigned as Event Staff!");
      setSearch('');          
      setSearchResults([]);   
      fetchStaffList();       
    } catch (err) { toast.error("Failed to assign staff"); }
  };

  const handleRemoveStaff = async (id) => {
    if (window.confirm("Revert this staff member to a regular user?")) {
      try {
        const response = await api.post(`/events/remove-staff/${id}`);
        if (response.data.success) {
          toast.success(response.data.message);
          fetchStaffList(); 
        }
      } catch (err) { toast.error("Action failed"); }
    }
  };

  const handleViewDetails = (teamGroup) => {
    setSelectedTeam(teamGroup);
    setActiveSubTab('team'); 
  };

  const handleBackToGrid = () => {
    setSelectedTeam(null);
    setSubTeamForm({ team_name: '', description: '' });
    setSelectedSubTeam(null);
  };

 const handleSubTeamSubmit = async (e) => {
    e.preventDefault();
    
    // Safety Check: Log the ID. If this is undefined, your 400 error is here.
    console.log("Creating sub-team for Event ID:", selectedTeam?.event_id);

    if (!selectedTeam?.event_id) {
      return toast.error("Event context missing. Please re-select the event.");
    }
    if (!subTeamForm.team_name) return toast.error("Please provide a team name");

    setIsSubmittingSubTeam(true);
    try {
      await api.post('/events/sub-teams', { 
        team_name: subTeamForm.team_name,
        description: subTeamForm.description,
        event_id: selectedTeam.event_id // Matches backend 'event_id'
      });
      
      toast.success("Sub Team created successfully!");
      setSubTeamForm({ team_name: '', description: '' });
      fetchSubTeams(selectedTeam.event_id); // Refresh list
      setActiveSubTab('view-subteam'); 
    } catch (err) { 
      console.error(err.response?.data);
      toast.error(err.response?.data?.message || "Failed to create sub team"); 
    } finally { 
      setIsSubmittingSubTeam(false); 
    }
  };
  const switchSubTab = (tabName) => {
    setActiveSubTab(tabName);
    if (tabName !== 'view-subteam') {
      setSelectedSubTeam(null); 
    }
  };

 const handleAssignToSubTeam = async (userId, subTeamId) => {
    if (!subTeamId || !userId) {
        return toast.error("Please select a valid sub-team and user");
    }

    try {
      // Ensure the keys match the backend: sub_team_id and user_id
      await api.post('/events/sub-teams/assign', { 
          sub_team_id: subTeamId, 
          user_id: userId 
      });

      toast.success("Staff assigned to Sub-Team!");
      
      // Refresh the list to show the new member count
      if (selectedTeam?.event_id) {
        fetchSubTeams(selectedTeam.event_id);
      }
    } catch (err) {
      console.error("Assignment Frontend Error:", err);
      toast.error(err.response?.data?.message || "Failed to assign staff");
    }
  };
  const handleRemoveFromSubTeam = async (userId, subTeamId) => {
    if (window.confirm("Remove this member from the sub-team?")) {
      try {
        await api.post('/events/sub-teams/remove-member', { sub_team_id: subTeamId, user_id: userId });
        toast.success("Member removed from sub-team");
        const res = await api.get(`/events/${selectedTeam.event_id}/sub-teams`);
        setSubTeamsList(res.data);
        const updatedSubTeam = res.data.find(st => st.id === subTeamId);
        setSelectedSubTeam(updatedSubTeam);
      } catch (err) { toast.error("Failed to remove member"); }
    }
  };

 const handleDeleteSubTeam = async (subTeamId) => {
    if (window.confirm("Are you sure you want to delete this entire sub-team?")) {
      try {
        // This will now match http://localhost:5000/api/events/sub-teams/1
        await api.delete(`/events/sub-teams/${subTeamId}`);
        
        toast.success("Sub Team deleted successfully!");
        
        // Refresh the list
        if (selectedTeam?.event_id) {
          fetchSubTeams(selectedTeam.event_id);
        }
      } catch (err) {
        console.error("Delete Error:", err);
        toast.error("Failed to delete sub team");
      }
    }
  };

  const navCards = [
    { id: 'onboarding', label: 'Staff Onboarding' },
    { id: 'management', label: 'Event Team Management' }
  ];

  return (
    <div className="org-hub-container">
      
      {/* GLOBAL HUB TOP RIBBON */}
      <div className="management-ribbon ribbon-left">
        {navCards.map((card) => (
          <div 
            key={card.id}
            className={`nav-card nav-card-fixed ${activeTab === card.id ? 'active-state' : ''}`}
            onClick={() => { setActiveTab(card.id); setSelectedTeam(null); }}
          >
            <span className="card-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* GLOBAL HUB WORKSPACE */}
      <div className="hub-workspace">

        {/* --- TAB 1: STAFF ONBOARDING --- */}
        {activeTab === 'onboarding' && (
          <div className="hub-content-wrapper">
            <div className="manage-staff-header">
              <h2>Manage Staff</h2>
              <p>Search for regular users and assign them as Event Staff.</p>
            </div>

            <div className="manage-staff-card">
              <label className="search-label">Search Staff</label>
              <div className="search-input-box">
                <input type="text" placeholder="Type user's name to search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="search-dropdown">
                    {searchResults.map(user => (
                      <div key={user.id} className="search-item">
                        <div className="search-item-info"><span>{user.full_name}</span><small>{user.email}</small></div>
                        <button onClick={() => handleAssignStaff(user.id)} className="add-btn">Assign Staff</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="manage-staff-table-card">
              <h3>List of Staff</h3>
              <table className="staff-table">
                <thead><tr><th>Name</th><th>Email</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {staffList.length > 0 ? staffList.map(staff => (
                    <tr key={staff.id}>
                      <td>{staff.full_name}</td><td>{staff.email}</td>
                      <td className="text-right"><button onClick={() => handleRemoveStaff(staff.id)} className="remove-btn">Remove</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="empty-table-row">No event staff found in the database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: EVENT TEAM MANAGEMENT --- */}
        {activeTab === 'management' && (
          <div className="hub-content-wrapper">
            {!selectedTeam ? (
              <div className="db-container">
                <div className="manage-staff-header">
                  <h2>Event Team Management</h2>
                  <p>Select an event below to manage its specific team and sub-teams.</p>
                </div>
                <div className="search-wrapper mb-25">
                  <div className="search-input-box">
                    <input type="text" placeholder="Search by event name..." value={eventSearchTerm} onChange={(e) => setEventSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="modern-card-grid">
                  {filteredTeams.map((team, index) => (
                    <div key={index} className="manage-staff-card card-flush">
                      <div className="status-badge status-approved badge-inline">TEAM ID: {team.team_id || "N/A"}</div>
                      <h3 className="card-title-dark">{team.event_title}</h3>
                      <p className="helper-text m-5-0"><strong>Manager:</strong> {team.manager_name || "N/A"}</p>
                      <p className="helper-text m-5-20"><strong>Total Staff:</strong> {team.staff_count}</p>
                      <button className="submit-btn-full" onClick={() => handleViewDetails(team)}>View Full Team</button>
                    </div>
                  ))}
                  {filteredTeams.length === 0 && !loading && <p className="helper-text">No team assignments found.</p>}
                </div>
              </div>
            ) : (
              <div className="w-100">
                <div className="flex-header-row">
                  <button className="back-btn back-btn-sm" onClick={handleBackToGrid}>&larr; Back</button>
                  <h2 className="m-0">Managing: <span className="text-mint">{selectedTeam.event_title}</span></h2>
                </div>

                <div className="management-ribbon ribbon-spaced">
                  <div className={`nav-card nav-card-sm ${activeSubTab === 'team' ? 'active-state' : ''}`} onClick={() => switchSubTab('team')}><span className="card-label">View Event Team</span></div>
                  <div className={`nav-card nav-card-sm ${activeSubTab === 'subteam' ? 'active-state' : ''}`} onClick={() => switchSubTab('subteam')}><span className="card-label">Create Sub Team</span></div>
                  <div className={`nav-card nav-card-sm ${activeSubTab === 'view-subteam' ? 'active-state' : ''}`} onClick={() => switchSubTab('view-subteam')}><span className="card-label">View Sub Team</span></div>
                </div>

                {activeSubTab === 'team' && (
                  <div className="manage-staff-table-card">
                    <h3>Current Staff ({selectedTeam.staff_count})</h3>
                    <table className="staff-table">
                      <thead>
                        <tr>
                          <th>Staff Name</th>
                          <th>Staff Email</th>
                          <th>Assigned By</th>
                          <th>Assign Sub-Team</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.members.map((m, idx) => (
                          <tr key={idx}>
                            <td><strong>{m.staff_name || "Unknown"}</strong></td>
                            <td>{m.staff_email || "N/A"}</td>
                            <td><span className="status-badge status-draft">{m.manager_name || "N/A"}</span></td>
                            {/* Look for this line in your table rows */}
{/* Inside your .map loop for selectedTeam.members */}
<td>
  <select 
    className="form-input table-select-input" 
    onChange={(e) => {
      const subId = e.target.value;
      // 'm' is the current member in the loop
      const uId = m.user_id || m.id; 
      
      console.log("Selected User ID:", uId, "Sub-Team ID:", subId);
      handleAssignToSubTeam(uId, subId);
    }}
    defaultValue=""
  >
    <option value="" disabled>Select Sub-Team...</option>
    {subTeamsList.map(st => (
      <option key={st.id} value={st.id}>{st.team_name}</option>
    ))}
  </select>
</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'subteam' && (
                  <div className="manage-staff-card">
                    <h3 className="section-title-dark mb-15">Create Sub Team</h3>
                    <p className="helper-text mb-20">Group your staff into specialized units for {selectedTeam.event_title}.</p>
                    <form className="form-column-group" onSubmit={handleSubTeamSubmit}>
                      <div className="input-group-full">
                        <label className="search-label">Sub Team Name *</label>
                        <input className="form-input input-padded" placeholder="e.g. Stage Setup Crew" value={subTeamForm.team_name} onChange={e => setSubTeamForm({...subTeamForm, team_name: e.target.value})} required />
                      </div>
                      <div className="input-group-full">
                        <label className="search-label">Description / Responsibilities</label>
                        <textarea className="form-input textarea-padded" placeholder="What is this team responsible for?" value={subTeamForm.description} onChange={e => setSubTeamForm({...subTeamForm, description: e.target.value})} />
                      </div>
                      <button type="submit" className="submit-btn-full" disabled={isSubmittingSubTeam || !subTeamForm.team_name}>
                        {isSubmittingSubTeam ? 'Creating...' : 'Create Sub Team'}
                      </button>
                    </form>
                  </div>
                )}

                {activeSubTab === 'view-subteam' && (
                  <div className="no-border-wrapper">
                    
                    {!selectedSubTeam ? (
                      <>
                        <div className="mb-20">
                          <h3 className="section-title-mint mb-8">Sub Teams for {selectedTeam.event_title}</h3>
                        </div>
                        
                        <div className="modern-card-grid">
                          {subTeamsList.length > 0 ? (
                            subTeamsList.map((st, idx) => {
                              const memberCount = st.members ? st.members.length : (st.member_count || 0);
                              return (
                                <div key={idx} className="event-card modern-subteam-card">
                                  <div className="status-badge status-draft badge-top">Team ID: {st.id || "N/A"}</div>
                                  <h3 className="event-title card-title-lg">{st.team_name}</h3>
                                  
                                  <div className="card-info-stack">
                                    <p className="helper-text m-0"><strong>Main Team:</strong> {selectedTeam.event_title}</p>
                                    <p className="helper-text m-0"><strong>Manager:</strong> {selectedTeam.manager_name || "Not Assigned"}</p>
                                    <p className="helper-text m-0"><strong>Total Staff:</strong> {memberCount}</p>
                                  </div>
                                  
                                  <div className="card-actions-row">
                                    <button className="submit-btn btn-flex-primary" onClick={() => setSelectedSubTeam(st)}>View Team</button>
                                    <button className="btn-flex-danger" onClick={() => handleDeleteSubTeam(st.id)}>Remove Team</button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="empty-state-dashed">
                              <p className="helper-text m-0">No sub teams created yet. Create one from the "Create Sub Team" tab!</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="sub-team-details">
                        <button className="secondary-btn back-link-btn" onClick={() => setSelectedSubTeam(null)}>&larr; Back to Sub Teams</button>
                        
                        <div className="manage-staff-table-card table-card-flat">
                          <div className="table-header-flex table-header-box">
                            <div className="flex-align-center">
                              <h3 className="table-header-title table-title-xl m-0">{selectedSubTeam.team_name}</h3>
                              <span className="status-badge status-approved m-0">{selectedSubTeam.members ? selectedSubTeam.members.length : 0} Members</span>
                            </div>
                            <p className="helper-text text-sm m-0"><strong>Responsibilities:</strong> {selectedSubTeam.description || "None provided"}</p>
                          </div>
                          
                          <table className="staff-table">
                            <thead>
                              <tr><th>Member Name</th><th>Email Address</th><th className="text-right">Action</th></tr>
                            </thead>
                            <tbody>
                              {selectedSubTeam.members && selectedSubTeam.members.length > 0 ? (
                                selectedSubTeam.members.map((m, idx) => (
                                  <tr key={idx}>
                                    <td><strong>{m.full_name || "Unknown"}</strong></td>
                                    <td>{m.email || "N/A"}</td>
                                    <td className="text-right">
                                      <button className="remove-btn text-sm" onClick={() => handleRemoveFromSubTeam(m.user_id, selectedSubTeam.id)}>Remove</button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="empty-table-cell">
                                    <p className="empty-title">No members assigned yet.</p>
                                    <p className="empty-subtitle">Go to "View Event Team" to assign someone to this sub-team.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStaff;