import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const StaffRegistrationsTab = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  useEffect(() => {
    const fetchStaffEvents = async () => {
      try {
        const res = await api.get('/events/assigned-events'); // Staff Route
        setEvents(res.data.success ? res.data.data : []);
      } catch (error) {
        toast.error("Failed to load events");
      }
    };
    fetchStaffEvents();
  }, []);

  const handleCardClick = async (event) => {
    setSelectedEvent(event);
    setLoadingRegs(true);
    try {
      const res = await api.get(`/events/staff/${event.id}/registrations`); // Staff Route
      setRegistrations(res.data.success ? res.data.data : []);
    } catch (err) {
      toast.error("Access Denied: View only allowed");
    } finally {
      setLoadingRegs(false);
    }
  };

  return (
    <div className="db-container">
      {!selectedEvent ? (
        <div className="event-grid">
          {events.map(event => (
            <div key={event.id} className="event-card" onClick={() => handleCardClick(event)} style={{cursor:'pointer'}}>
              <h3 className="event-title">{event.title}</h3>
              <p className="helper-text">View Registrations</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <button className="back-btn" onClick={() => setSelectedEvent(null)}>&larr; Back</button>
          <div className="manage-staff-table-card" style={{marginTop:'20px'}}>
             <table className="staff-table">
                <thead><tr><th>Name</th><th>Email</th></tr></thead>
                <tbody>
                  {registrations.map((r, i) => (
                    <tr key={i}><td>{r.full_name}</td><td>{r.email}</td></tr>
                  ))}
                </tbody>
             </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffRegistrationsTab;