import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const ViewTeamTab = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // ✅ Now using the correct backend route we set up for assigned team members
      const res = await api.get('/events/event-team');
      const data = res.data.success ? res.data.data : res.data;
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic to count staff per unique event/team
  const getGroupedTeams = () => {
    const groups = {};
    teamMembers.forEach(member => {
      // Fallback in case event_title is missing
      const eventName = member.event_title || "Unknown Event"; 
      
      if (!groups[eventName]) {
        groups[eventName] = {
          ...member,
          event_title: eventName,
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

  const handleViewDetails = (eventTitle) => {
    const teamGroup = groupedTeams.find(t => t.event_title === eventTitle);
    setSelectedTeam(teamGroup);
  };

  const handleBack = () => {
    setSelectedTeam(null);
  };

  // ✅ CRASH-PROOF SEARCH: Filters by event title safely
  const filteredTeams = groupedTeams.filter(t => {
    const titleToSearch = t.event_title || "";
    const term = searchTerm?.toLowerCase() || "";
    return titleToSearch.toLowerCase().includes(term);
  });

//   return (
//     <div className="db-container">
//       {!selectedTeam ? (
//         <>
//           <div className="search-wrapper">
//             <input 
//               type="text" 
//               placeholder="Search by event name..." 
//               className="mgmt-input"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>

//           <div className="event-grid">
//             {filteredTeams.map((team, index) => (
//               <div key={index} className="event-card">
//                 <h2 className="event-title">
//                   Team : {team.team_id || "N/A"}
//                 </h2>
                
//                 <p className="event-title" style={{ marginTop: '15px', fontSize: '1rem', fontWeight: 'bold' }}>
//                   {team.event_title}
//                 </p>
                
//                 <p className="helper-text" style={{ margin: '10px 0' }}>
//                   <strong>Manager:</strong> {team.manager_name || "N/A"}
//                 </p>

//                 <p className="helper-text" style={{ marginBottom: '20px' }}>
//                   <strong>Staff:</strong> {team.staff_count}
//                 </p>

//                 <div className="event-card-actions">
//                   <button 
//                     className="event-card-btn"
//                     onClick={() => handleViewDetails(team.event_title)}
//                   >
//                     View Team Details
//                   </button>
//                 </div>
//               </div>
//             ))}

//             {filteredTeams.length === 0 && !loading && (
//               <p className="helper-text">No team assignments found.</p>
//             )}
//           </div>
//         </>
//       ) : (
//         <>
//           <div className="form-actions">
//             <button className="back-btn" onClick={handleBack}>
//               &larr; Back to Teams
//             </button>
//           </div>
          
//           <div className="manage-staff-table-card" style={{ marginTop: '20px' }}>
//             <div className="table-header-flex">
//               <h3 className="table-header-title">
//                 Team Members for: {selectedTeam.event_title}
//               </h3>
//             </div>

//             <table className="staff-table">
//               <thead>
//                 <tr>
//                   <th>Staff Name</th>
//                   <th>Staff Email</th>
//                   <th>Assigned By (Manager)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {selectedTeam.members.map((m, idx) => (
//                   <tr key={idx}>
//                     {/* ✅ Uses the correct database variable names (staff_name, staff_email) */}
//                     <td><strong>{m.staff_name || "Unknown"}</strong></td>
//                     <td>{m.staff_email || "N/A"}</td>
//                     <td>{m.manager_name || "N/A"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };
return (
    <div className="db-container">
      {!selectedTeam ? (
        <>
          {/* SEARCH SECTION */}
          <div className="mgmt-card" style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search teams by event name..." 
              className="mgmt-input"
              style={{ marginBottom: 0 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* TEAM CARDS GRID */}
          <div className="event-grid">
            {filteredTeams.map((team, index) => (
              <div key={index} className="event-card">
                <div className="status-badge status-blue">
                   Team ID: {team.team_id || "N/A"}
                </div>
                
                <h3 className="event-title" style={{ marginTop: '15px' }}>
                  {team.event_title}
                </h3>
                
                <div style={{ margin: '15px 0' }}>
                  <p className="helper-text"><strong>Manager:</strong> {team.manager_name}</p>
                  <p className="helper-text"><strong>Total Staff:</strong> {team.staff_count}</p>
                </div>

                <button 
                  className="update-pill-btn"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  onClick={() => handleViewDetails(team.event_title)}
                >
                  View Full Team
                </button>
              </div>
            ))}

            {filteredTeams.length === 0 && !loading && (
              <div className="mgmt-card" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
                <p className="helper-text">No team assignments found.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* DETAILED TABLE VIEW */}
          <div className="mgmt-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h3 className="table-header-blue" style={{ margin: 0 }}>
                  Event: {selectedTeam.event_title}
                </h3>
                <p className="type-subtext">Managed by {selectedTeam.manager_name}</p>
              </div>
              <button className="mgmt-cancel-btn" onClick={() => setSelectedTeam(null)}>
                &larr; Back to Teams
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th className="mgmt-th">Staff Name</th>
                    <th className="mgmt-th">Email</th>
                    <th className="mgmt-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.members.map((m, idx) => (
                    <tr key={idx}>
                      <td className="mgmt-td"><strong>{m.staff_name || "Unknown"}</strong></td>
                      <td className="mgmt-td">{m.staff_email || "N/A"}</td>
                      <td className="mgmt-td">
                        <span className="status-badge status-approved">Active Staff</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewTeamTab;