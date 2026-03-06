import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const RegistrationsTab = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchEventsAndCounts = async () => {
      try {
        // 1. Fetch all managed events
        const res = await api.get('/events/managed-events');
        const eventData = res.data.success ? res.data.data : res.data;
        const eventList = Array.isArray(eventData) ? eventData : [];

        // 2. Automatically fetch the exact registration count for EACH event 
        // so the cards show the correct number right away.
        const eventsWithCounts = await Promise.all(
          eventList.map(async (ev) => {
            try {
              const regRes = await api.get(`/events/${ev.id}/registrations`);
              const regs = regRes.data.success ? regRes.data.data : (Array.isArray(regRes.data) ? regRes.data : []);
              
              // Attach the real count to the event object
              return { ...ev, live_count: regs.length };
            } catch (err) {
              return { ...ev, live_count: 0 };
            }
          })
        );

        setEvents(eventsWithCounts);
      } catch (error) {
        toast.error("Failed to load events");
      }
    };

    fetchEventsAndCounts();
  }, []);

  const handleCardClick = async (event) => {
    setSelectedEvent(event);
    setLoadingRegs(true);
    
    try {
      const res = await api.get(`/events/${event.id}/registrations`);
      setRegistrations(res.data.success ? res.data.data : res.data);
    } catch (err) {
      toast.error("Failed to load registration list");
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleBackClick = () => {
    setSelectedEvent(null);
    setRegistrations([]);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    event.deleted_at === null
  );

//   return (
//     <div className="db-container">
      
//       {!selectedEvent ? (
//         /* =========================================
//            VIEW 1: EVENT CARDS GRID 
//            ========================================= */
//         <>

//           <div className="search-wrapper">
//             <input 
//               type="text" 
//               placeholder="Search events..." 
//               className="mgmt-input"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           <div className="event-grid">
//             {filteredEvents.map(event => (
//               <div key={event.id} className="event-card">
                
//                 <div className={`status-badge status-${event.status?.toLowerCase() || 'approved'}`}>
//                   {event.status || 'APPROVED'}
//                 </div>
                
//                 <h3 className="event-title">{event.title}</h3>
//                 <p className="helper-text">📅 {new Date(event.event_date).toLocaleDateString()}</p>
//                 <p className="helper-text">📍 {event.location || 'Venue TBD'}</p>
                
//                 {/* 🔥 This will now show the LIVE exact count for every card! 🔥 */}
//                 <p className="helper-text" style={{ marginTop: '10px', fontWeight: 'bold' }}>
//                   👥 Total Registered: {event.live_count || 0}
//                 </p>

//                 <div className="event-card-actions">
//                   <button 
//                     className={`event-card-btn ${selectedEvent?.id === event.id ? 'active' : ''}`}
//                     onClick={() => handleCardClick(event)}
//                   >
//                     View Registrations
//                   </button>
//                 </div>

//               </div>
//             ))}
            
//             {filteredEvents.length === 0 && (
//               <p className="helper-text">No events found.</p>
//             )}
//           </div>
//         </>
//       ) : (
//         /* =========================================
//            VIEW 2: REGISTRATION LIST TABLE 
//            ========================================= */
//         <>
//           <div className="form-actions">
//             <button className="back-btn" onClick={handleBackClick}>
//               &larr; Back to Events
//             </button>
//           </div>

//           <br />

//           <div className="manage-staff-table-card">
            
//             <div className="table-header-flex">
//               <h3 className="table-header-title">
//                 Registrations for "{selectedEvent.title}"
//               </h3>
//               <span className="staff-chip">
//                 Total: {registrations.length}
//               </span>
//             </div>

//             {loadingRegs ? (
//               <p className="helper-text" style={{ padding: '2rem', textAlign: 'center' }}>Loading attendees...</p>
//             ) : (
//               <table className="staff-table">
//                 <thead>
//                   <tr>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Date Registered</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {registrations.map((reg, idx) => (
//                     <tr key={idx}>
//                       <td><strong>{reg.full_name}</strong></td>
//                       <td>{reg.email}</td>
//                       <td>{new Date(reg.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
//                     </tr>
//                   ))}
                  
//                   {registrations.length === 0 && (
//                     <tr>
//                       <td colSpan="3" className="helper-text" style={{ textAlign: 'center', padding: '2rem' }}>
//                         No users have registered for this event yet.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </>
//       )}

//     </div>
//   );
// };

return (
    <div className="db-container">
      {!selectedEvent ? (
        <>
          {/* SEARCH WRAPPER */}
          <div className="mgmt-card" style={{ marginBottom: '25px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search events to view registrations..." 
              className="mgmt-input"
              style={{ marginBottom: 0 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* EVENT CARDS GRID */}
          <div className="event-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className={`status-badge status-${event.status?.toLowerCase() || 'approved'}`}>
                  {event.status || 'APPROVED'}
                </div>
                
                <h3 className="event-title" style={{ marginTop: '15px' }}>{event.title}</h3>
                
                <div style={{ margin: '12px 0' }}>
                  <p className="helper-text">📅 {new Date(event.event_date).toLocaleDateString()}</p>
                  <p className="helper-text">📍 {event.location || 'Venue TBD'}</p>
                </div>
                
                <div className="status-badge status-blue" style={{ width: '100%', textAlign: 'center', marginBottom: '15px' }}>
                  👥 Registered: {event.live_count || 0}
                </div>

                <button 
                  className="update-pill-btn" 
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  onClick={() => handleCardClick(event)}
                >
                  View Attendees
                </button>
              </div>
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="mgmt-card" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
                <p className="helper-text">No matching events found.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* REGISTRATION LIST TABLE */}
          <div className="mgmt-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h3 className="table-header-blue" style={{ margin: 0 }}>
                  Event : {selectedEvent.title}
                </h3><br />
                <span className="type-subtext">Total Attendees: {registrations.length}</span>
              </div>
              <button className="mgmt-cancel-btn" onClick={() => setSelectedEvent(null)}>
                &larr; Back to Events
              </button>
            </div>

            {loadingRegs ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p className="helper-text">Loading registrations...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th className="mgmt-th">Registered Name</th>
                      <th className="mgmt-th">Email Address</th>
                      <th className="mgmt-th">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, idx) => (
                      <tr key={idx}>
                        <td className="mgmt-td"><strong>{reg.full_name}</strong></td>
                        <td className="mgmt-td">{reg.email}</td>
                        <td className="mgmt-td">
                          {new Date(reg.registered_at).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                      </tr>
                    ))}
                    
                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan="3" className="mgmt-td" style={{ textAlign: 'center', padding: '40px' }}>
                          <p className="helper-text">No users have registered for this event yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationsTab;