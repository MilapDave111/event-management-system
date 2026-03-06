import React, { useState } from 'react';
import MemberExplorerTab from './tabs/MemberExplorerTab';
import AssignRolesTab from './tabs/AssignRolesTab';
import StaffManagementTab from './tabs/StaffManagementTab';
import "../../../styles/GlobalHub.css";

const MemberRoleHub = () => {
  const [activeTab, setActiveTab] = useState('explorer');

  const navCards = [
    { id: 'explorer', label: 'Role Explorer' },
    { id: 'assign', label: 'Assign Manager' },
    { id: 'staff', label: 'Staff Members' }
  ];

  return (
    <div className="org-hub-container">
      <div className="management-ribbon">
        {navCards.map((card) => (
          <div 
            key={card.id}
            className={`nav-card ${activeTab === card.id ? 'active-state' : ''}`}
            onClick={() => setActiveTab(card.id)}
          >
            <span className="card-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="hub-workspace">
        {activeTab === 'explorer' && <MemberExplorerTab />}
        {activeTab === 'assign' && <AssignRolesTab />}
        {activeTab === 'staff' && <StaffManagementTab />}
      </div>
    </div>
  );
};

export default MemberRoleHub;