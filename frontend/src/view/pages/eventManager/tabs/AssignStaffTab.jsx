import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const AssignStaffTab = () => {
  const [events, setEvents] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evRes, staffRes] = await Promise.all([
          api.get('/events/managed-events'),
          api.get('/events/list-staff') 
        ]);
        
        // Safely extract Events
        const eventData = evRes.data.success ? evRes.data.data : evRes.data;
        setEvents(Array.isArray(eventData) ? eventData : []);
        
        // Safely extract Staff Members
        const staffData = staffRes.data?.success ? staffRes.data.data : staffRes.data;
        setStaffMembers(Array.isArray(staffData) ? staffData : []);
        
      } catch (err) { 
        toast.error("Failed to load data. Check console."); 
        console.error("API Load Error:", err);
      }
    };
    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedEvent) return toast.error("Please select an event");
    if (!targetUser) return toast.error("Please select a staff member");
    
    setIsSubmitting(true);
    try {
      await api.post('/events/assign-staff', { 
        eventId: parseInt(selectedEvent), 
        userId: parseInt(targetUser) 
      }); 
      toast.success("Staff successfully assigned!");
      setTargetUser(''); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // --- SMART FALLBACK FUNCTIONS ---
  // These are now perfectly matched to your API response!
  const getStaffId = (staff) => staff.user_id || staff.team_id || staff.id;
  const getStaffName = (staff) => staff.staff_name || staff.full_name || staff.name || "Unknown Name";
  const getStaffEmail = (staff) => staff.staff_email || staff.email || "No Email";

  return (
    <div className="event-form" style={{ padding: '20px' }}>
      
      {/* --- EVENT DROPDOWN --- */}
      <div className="input-group">
        <label>1. Select Managed Event</label>
        <select 
          className="form-select" 
          value={selectedEvent} 
          onChange={e => setSelectedEvent(e.target.value)}
        >
          <option value="">-- Choose Event --</option>
          {events.map((e, index) => (
            <option key={`event-${e.id || index}`} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {/* --- STAFF DROPDOWN --- */}
      {selectedEvent && (
        <div className="input-group" style={{ marginTop: '20px' }}>
          <label>2. Select Event Staff to Assign</label>
          <select 
            className="form-select" 
            value={targetUser} 
            onChange={e => setTargetUser(e.target.value)}
          >
            <option value="">-- Select Event Staff --</option>
            
            {staffMembers.map((staff, index) => {
              const sId = getStaffId(staff);
              const sName = getStaffName(staff);
              const sEmail = getStaffEmail(staff);

              // Failsafe: Print raw JSON if it's completely unreadable
              if (!sId) {
                return (
                  <option key={`raw-${index}`} value="" disabled>
                    RAW DATA: {JSON.stringify(staff)}
                  </option>
                );
              }

              return (
                <option key={`staff-${sId}`} value={sId}>
                  {sName} — {sEmail}
                </option>
              );
            })}
          </select>
          
          <button 
            className="submit-btn" 
            onClick={handleAssign} 
            disabled={isSubmitting || !targetUser} 
            style={{ marginTop: '30px', width: '100%', padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            {isSubmitting ? "Processing Assignment..." : "Confirm Staff Assignment"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignStaffTab;