import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import '../../../../view/styles/Form.css'; 
import '../../../../view/styles/Management.css'; 
import '../../../../view/styles/GlobalHub.css'; 

// Accept the isTaskMode prop (defaults to false for the Events page)
const ViewTeamTab = ({ isTaskMode = false }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeam, setSelectedTeam] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('team'); 

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium', due_date: '', assigned_to: ''
  });

  const [isSubmittingSubTeam, setIsSubmittingSubTeam] = useState(false);
  const [subTeamForm, setSubTeamForm] = useState({
    team_name: '', description: ''
  });

  const [subTeamsList, setSubTeamsList] = useState([]);

  useEffect(() => {
    fetchTeamData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'view-subteam' && selectedTeam) {
      api.get(`/events/${selectedTeam.event_id}/sub-teams`)
        .then(res => setSubTeamsList(res.data))
        .catch(err => {
            console.error("Fetch Sub Teams Error:", err); // Added this so you can see exact errors in browser console!
            toast.error("Failed to load sub teams");
        });
    }
  }, [activeSubTab, selectedTeam]);useEffect(() => {
    // Only fetch if we have a valid ID to avoid 404/400
    if (activeSubTab === 'view-subteam' && selectedTeam?.event_id) {
      api.get(`/events/${selectedTeam.event_id}/sub-teams`)
        .then(res => {
            // Check if res.data is the array directly or inside res.data.data
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setSubTeamsList(data);
        })
        .catch(err => {
            console.error("Fetch Sub Teams Error:", err);
            toast.error("Failed to load sub teams");
        });
    }
  }, [activeSubTab, selectedTeam]);

  const fetchTeamData = async () => {
    try {
      const res = await api.get('/events/event-team');
      const data = res.data.success ? res.data.data : res.data;
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const getGroupedTeams = () => {
    const groups = {};
    teamMembers.forEach(member => {
      const eventName = member.event_title || "Unknown Event"; 
      if (!groups[eventName]) {
        groups[eventName] = {
          event_title: eventName,
          event_id: member.event_id,
          manager_name: member.manager_name,
          team_id: member.team_id,
          staff_count: 0,
          members: []
        };
      }
      groups[eventName].staff_count += 1;
      groups[eventName].members.push(member);
    });
    return Object.values(groups);
  };

  const groupedTeams = getGroupedTeams();

  const filteredTeams = groupedTeams.filter(t => {
    const titleToSearch = t.event_title || "";
    return titleToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetails = (teamGroup) => {
    setSelectedTeam(teamGroup);
    setActiveSubTab('team'); 
  };

  const handleBackToGrid = () => {
    setSelectedTeam(null);
    setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
    setSubTeamForm({ team_name: '', description: '' });
  };

  const handleSubTeamSubmit = async (e) => {
    e.preventDefault();
    if (!subTeamForm.team_name) return toast.error("Please provide a team name");
    
    setIsSubmittingSubTeam(true);
    try {
      // 1. FIX: Send data to the backend to actually create the sub-team!
      await api.post('/events/sub-teams', {
          ...subTeamForm,
          event_id: selectedTeam.event_id
      });
      
      toast.success("Sub Team created successfully!");
      setSubTeamForm({ team_name: '', description: '' });
      
      // 2. Automatically fetch the newly updated list
      const res = await api.get(`/events/${selectedTeam.event_id}/sub-teams`);
      setSubTeamsList(res.data);
      
      // 3. Switch tab to show the new team
      setActiveSubTab('view-subteam'); 
    } catch (err) {
      console.error("Create Sub Team Error:", err);
      toast.error(err.response?.data?.message || "Failed to create sub team");
    } finally {
      setIsSubmittingSubTeam(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assigned_to || !taskForm.due_date) {
        return toast.error("Please fill required fields (Title, Due Date, Assignee)");
    }
    setIsSubmittingTask(true);
    try {
      await api.post('/events/tasks', { ...taskForm, event_id: selectedTeam.event_id });
      toast.success("Task assigned successfully!");
      setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  if (!selectedTeam) {
    return (
      <div className="db-container">
        <div className="search-wrapper" style={{ marginBottom: '25px' }}>
          <input type="text" placeholder="Search by event name..." className="mgmt-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="event-grid">
          {filteredTeams.map((team, index) => (
            <div key={index} className="event-card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div className="status-badge status-approved">Team ID: {team.team_id || "N/A"}</div>
              <h3 className="event-title" style={{ marginTop: '10px' }}>{team.event_title}</h3>
              <p className="helper-text" style={{ margin: '10px 0' }}><strong>Manager:</strong> {team.manager_name || "N/A"}</p>
              <p className="helper-text" style={{ marginBottom: '20px' }}><strong>Total Staff:</strong> {team.staff_count}</p>
              <button className="submit-btn" style={{ width: '100%', padding: '10px' }} onClick={() => handleViewDetails(team)}>
                View Full Team
              </button>
            </div>
          ))}
          {filteredTeams.length === 0 && !loading && <p className="helper-text">No team assignments found.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button className="secondary-btn" onClick={handleBackToGrid} style={{ padding: '8px 16px' }}>
          &larr; Back
        </button>
        <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.5rem' }}>
          {isTaskMode ? 'Managing: ' : 'Viewing: '}<span style={{ color: '#47B599' }}>{selectedTeam.event_title}</span>
        </h2>
      </div>

      {/* ONLY SHOW THESE TABS IF WE ARE IN THE "TASKS" PAGE */}
      {isTaskMode && (
        <div className="management-ribbon" style={{ marginBottom: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', justifyContent: 'flex-start', gap: '15px' }}>
          <div className={`nav-card ${activeSubTab === 'team' ? 'active-state' : ''}`} onClick={() => setActiveSubTab('team')} style={{ maxWidth: '180px' }}>
            <span className="card-label">View Event Team</span>
          </div>
          <div className={`nav-card ${activeSubTab === 'subteam' ? 'active-state' : ''}`} onClick={() => setActiveSubTab('subteam')} style={{ maxWidth: '180px' }}>
            <span className="card-label">Create Sub Team</span>
          </div>
          <div className={`nav-card ${activeSubTab === 'view-subteam' ? 'active-state' : ''}`} onClick={() => setActiveSubTab('view-subteam')} style={{ maxWidth: '180px' }}>
            <span className="card-label">View Sub Team</span>
          </div>
          <div className={`nav-card ${activeSubTab === 'assign' ? 'active-state' : ''}`} onClick={() => setActiveSubTab('assign')} style={{ maxWidth: '180px' }}>
            <span className="card-label">Assign Task</span>
          </div>
        </div>
      )}

      {/* DYNAMIC PADDING: If we are in simple mode, we don't need the card wrapper styling */}
      <div className={isTaskMode ? "mgmt-card" : ""} style={isTaskMode ? { padding: '30px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' } : {}}>
        
        {/* --- 1: STAFF TABLE (Shows in both places) --- */}
        {activeSubTab === 'team' && (
          <div className="manage-staff-table-card" style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <div className="table-header-flex">
              <h3 className="table-header-title" style={{ fontWeight: 'bold' }}>Current Staff ({selectedTeam.staff_count})</h3>
            </div>
            <table className="staff-table">
              <thead><tr><th>Staff Name</th><th>Staff Email</th><th>Assigned By</th></tr></thead>
              <tbody>
                {selectedTeam.members.map((m, idx) => (
                  <tr key={idx}>
                    <td><strong>{m.staff_name || "Unknown"}</strong></td>
                    <td>{m.staff_email || "N/A"}</td>
                    <td><span className="status-badge status-draft">{m.manager_name || "N/A"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- THE REST ONLY SHOW IF IN TASK MODE --- */}
        {isTaskMode && activeSubTab === 'subteam' && (
          <div className="mgmt-main-card" style={{ border: 'none', boxShadow: 'none', padding: 0, maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#47B599', marginBottom: '8px' }}>Create Sub Team</h3>
              <p className="helper-text">Group your staff into specialized units for <strong>{selectedTeam.event_title}</strong>.</p>
            </div>
            <form className="event-form" onSubmit={handleSubTeamSubmit}>
              <div className="input-group">
                <label>Sub Team Name *</label>
                <input className="form-input" placeholder="e.g. Stage Setup Crew" value={subTeamForm.team_name} onChange={e => setSubTeamForm({...subTeamForm, team_name: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Description / Responsibilities</label>
                <textarea className="form-textarea" placeholder="What is this team responsible for?" style={{minHeight: '100px'}} value={subTeamForm.description} onChange={e => setSubTeamForm({...subTeamForm, description: e.target.value})} />
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmittingSubTeam || !subTeamForm.team_name} style={{ marginTop: '20px', width: '100%', padding: '16px', borderRadius: '12px' }}>
                {isSubmittingSubTeam ? 'Creating...' : 'Create Sub Team'}
              </button>
            </form>
          </div>
        )}

        {isTaskMode && activeSubTab === 'view-subteam' && (
          <div className="manage-staff-table-card" style={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <div className="table-header-flex">
              <h3 className="table-header-title" style={{ fontWeight: 'bold' }}>Sub Teams for {selectedTeam.event_title}</h3>
            </div>
            <table className="staff-table">
              <thead>
                <tr><th>Sub Team Name</th><th>Description</th><th>Total Members</th></tr>
              </thead>
              <tbody>
                {subTeamsList.length > 0 ? (
                  subTeamsList.map((st, idx) => (
                    <tr key={idx}>
                      <td><strong>{st.team_name}</strong></td>
                      <td>{st.description || "N/A"}</td>
                      <td><span className="status-badge status-approved">{st.member_count || 0} Members</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No sub teams created yet. Create one from the "Create Sub Team" tab!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isTaskMode && activeSubTab === 'assign' && (
          <div className="mgmt-main-card" style={{ border: 'none', boxShadow: 'none', padding: 0, maxWidth: '800px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#47B599', marginBottom: '8px' }}>Assign New Task</h3>
              <p className="helper-text">Delegate operational duties specifically for <strong>{selectedTeam.event_title}</strong>.</p>
            </div>
            <form className="event-form" onSubmit={handleTaskSubmit}>
              <div className="input-group">
                <label>Task Title *</label>
                <input className="form-input" placeholder="e.g. VIP Gate Security" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="form-textarea" placeholder="Provide instructions..." style={{minHeight: '80px'}} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Due Date *</label>
                  <input type="date" className="form-input" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} required />
                </div>
              </div>
              <div className="input-group">
                <label>Assign To Member *</label>
                <select className="form-select" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} required>
                  <option value="">-- Select Team Member --</option>
                  {selectedTeam.members.map((m, idx) => (
                    <option key={idx} value={m.user_id || m.id || m.staff_email}>{m.staff_name || "Unknown"} ({m.staff_email || "N/A"})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="submit-btn" disabled={isSubmittingTask} style={{ marginTop: '20px', width: '100%', padding: '16px', borderRadius: '12px' }}>
                {isSubmittingTask ? 'Assigning...' : 'Confirm Task Assignment'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ViewTeamTab;