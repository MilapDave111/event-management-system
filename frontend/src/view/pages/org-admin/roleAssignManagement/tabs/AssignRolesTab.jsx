import React, { useState, useEffect } from 'react';
import api from '../../../../../services/api';
import toast from 'react-hot-toast';

const AssignRolesTab = () => {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [mode, setMode] = useState('self'); 
  const [targetUser, setTargetUser] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evRes, memRes] = await Promise.all([
          api.get('/events/my-events'),
          api.get('/users/org-members') 
        ]);
        setEvents(evRes.data.filter(e => e.deleted_at === null));
        setMembers(memRes.data);
      } catch (err) { toast.error("Failed to load data"); }
    };
    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedEvent) return toast.error("Please select an event");
    setIsSubmitting(true);
    try {
      const payload = {
        eventId: selectedEvent,
        action: mode === 'self' ? 'self_manage' : 'assign_manager',
        managerId: mode === 'self' ? null : targetUser
      };
      await api.post('/events/assign-role', payload);
      toast.success("Role assigned successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="event-form">
      <div className="input-group">
        <label>1. Select Event</label>
        <select className="form-select" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          <option value="">-- Choose Event --</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {selectedEvent && (
        <>
          <div className="input-group" style={{ marginTop: '20px' }}>
            <label>2. Management Authority</label>
            <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="self">Self Manage (Org Admin)</option>
              <option value="assign">Assign Other Member</option>
            </select>
          </div>

          {mode === 'assign' && (
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>3. Select Member from Organization</label>
              <select className="form-select" value={targetUser} onChange={e => setTargetUser(e.target.value)}>
                <option value="">-- Select Person --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>)}
              </select>
            </div>
          )}

          <button className="submit-btn" onClick={handleAssign} disabled={isSubmitting} style={{ marginTop: '30px' }}>
            {isSubmitting ? "Processing..." : "Confirm Assignment"}
          </button>
        </>
      )}
    </div>
  );
};

export default AssignRolesTab;