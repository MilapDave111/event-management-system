import React, { useState, useEffect } from 'react';
import api from '../../../../services/api';

const StaffViewTeamTab = () => {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    api.get('/events/staff/event-team').then(res => {
      setTeamMembers(res.data.success ? res.data.data : []);
    });
  }, []);

  return (
    <div className="db-container">
      <div className="manage-staff-table-card">
        <h3>Current Team Assignments</h3>
        <table className="staff-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Managed By</th>
              <th>Assigned Event</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m, idx) => (
              <tr key={idx}>
                <td><strong>{m.staff_name}</strong></td>
                <td>{m.manager_name}</td>
                <td>{m.event_title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffViewTeamTab;