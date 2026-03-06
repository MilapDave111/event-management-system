import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/EventManager.css';

const TaskManagerHub = () => {
  const [searchParams] = useSearchParams();
  const currentView = searchParams.get('view');

  const [formStep, setFormStep] = useState(1);
  const [eventType, setEventType] = useState('');
  const [teamTitle, setTeamTitle] = useState('');
  const [memberLimit, setMemberLimit] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]); // Array of {id, full_name, role}
  const [staffResults, setStaffResults] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (staffSearch.length > 1) {
      api.get(`/users/search-staff?search=${staffSearch}`).then(res => setStaffResults(res.data));
    } else { setStaffResults([]); }
  }, [staffSearch]);

  // Member add kare tyare j "role" property khali rakhi ne add karvani
  const addStaffMember = (userData) => {
    if (selectedStaff.length >= memberLimit) {
      toast.error(`Limit reached! Max ${memberLimit} members.`);
      return;
    }

    const newMember = typeof userData === 'string' 
      ? { id: `manual-${Date.now()}`, full_name: userData, role: '', isManual: true }
      : { ...userData, role: '' };

    if (selectedStaff.find(s => s.full_name.toLowerCase() === newMember.full_name.toLowerCase())) {
      toast.error("Already added.");
      return;
    }

    setSelectedStaff([...selectedStaff, newMember]);
    setStaffSearch('');
    setStaffResults([]);
  };

  // Specific member no role update karva mate
  const handleRoleChange = (index, value) => {
    const updated = [...selectedStaff];
    updated[index].role = value;
    setSelectedStaff(updated);
  };

  const proceedToDetails = (e) => {
    e.preventDefault();
    if (selectedStaff.length === 0) return toast.error("Please add at least one member.");
    if (selectedStaff.some(s => !s.role)) return toast.error("Please assign roles to all members.");
    setFormStep(2);
  };

  // Final Submit Step
  const finalSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        event_type: eventType,
        team_title: teamTitle,
        members: selectedStaff, // Aa list ma name ane role banne sathe jashe
        start_date: startDate,
        due_date: dueDate
      };
      await api.post('/events/assign-tasks-final', payload);
      toast.success("Team assigned with specific roles!");
      setFormStep(1);
      setSelectedStaff([]);
    } catch (err) { toast.error("Failed."); }
  };

  if (currentView === 'features') {
    return (
      <div className="hub-center-wrapper">
        <div className="event-card hub-form-container">
          {formStep === 1 ? (
            <form onSubmit={proceedToDetails} className="event-form">
              <h2 className="manager-title-centered">Team Assignment Portal</h2>
              
              <div className="input-group">
                <label className="form-label">Event Type</label>
                <input className="form-input" value={eventType} onChange={(e) => setEventType(e.target.value)} required />
              </div>

              <div className="input-group">
                <label className="form-label">Title of Team</label>
                <input className="form-input" value={teamTitle} onChange={(e) => setTeamTitle(e.target.value)} required />
              </div>

              <div className="form-column-group">
                <div className="input-group-full">
                  <label className="form-label">Member Limit</label>
                  <input type="number" className="form-input" value={memberLimit} onChange={(e) => setMemberLimit(e.target.value)} required />
                </div>
                <div className="input-group-full relative-pos">
                  <label className="form-label">Search/Type Member</label>
                  <input className="form-input" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} 
                         onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStaffMember(staffSearch))} />
                  {staffResults.length > 0 && (
                    <div className="search-dropdown">
                      {staffResults.map(u => <div key={u.id} className="search-item" onClick={() => addStaffMember(u)}>{u.full_name}</div>)}
                    </div>
                  )}
                </div>
              </div>

              {/* LIST OF MEMBERS WITH INDIVIDUAL ROLE INPUTS */}
              <div className="member-role-assignment-list">
                {selectedStaff.map((member, index) => (
                  <div key={member.id} className="member-role-card">
                    <div className="member-header">
                      <span>Member {index + 1}: <b>{member.full_name}</b></span>
                      <button type="button" className="remove-btn" onClick={() => setSelectedStaff(selectedStaff.filter((_, i) => i !== index))}>×</button>
                    </div>
                    <input 
                      className="form-input-small" 
                      placeholder={`Assign role for ${member.full_name}...`}
                      value={member.role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-btn-full">Next: Set Dates</button>
            </form>
          ) : (
            /* STEP 2: DATES FORM */
            <form onSubmit={finalSubmit} className="event-form">
              <h2 className="manager-title-centered">Task Assignment Details</h2>
              <div className="read-only-box">Team: {teamTitle} | Members: {selectedStaff.length}</div>
              
              <div className="input-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" onChange={(e) => setDueDate(e.target.value)} required />
              </div>

              <div className="button-group-row">
                <button type="button" className="secondary-btn" onClick={() => setFormStep(1)}>Back</button>
                <button type="submit" className="primary-btn-submit">Confirm Assignment</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return <div className="manager-container">Select a feature from sidebar</div>;
};

export default TaskManagerHub;