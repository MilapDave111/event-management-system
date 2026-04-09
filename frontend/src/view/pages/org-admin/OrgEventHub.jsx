import React, { useState } from 'react';
import CreateEventTab from './tabs/CreateEventTab';
import UpdateEventTab from './tabs/UpdateEventTab';
import DraftsListTab from './tabs/DraftsListTab';
import StatusTrackerTab from './tabs/StatusTrackerTab';
import TrashTab from './tabs/TrashTab';
import ArchiveTab from './tabs/ArchiveTab';
import EventExplorerTab from './tabs/EventExplorerTab';
import '../../styles/GlobalHub.css'; // New responsive hub styles
import '../../styles/Form.css'; //

const OrgEventHub = () => {
  const [activeTab, setActiveTab] = useState('explorer');
  const [resumeEventId, setResumeEventId] = useState(null);

  const handleResume = (id) => {
    setResumeEventId(id); 
    setActiveTab('new'); 
  };

  const navCards = [
    { id: 'explorer', label: 'Event Explorer' },
    { id: 'new', label: '+New Event' },
    { id: 'update', label: 'Update Event Details' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'status', label: 'Status' },
    { id: 'trash', label: 'Trash' },
    { id: 'archive', label: 'Archive' },  
    
  ];

 return (
    <div className="org-hub-container">
      <div className="management-ribbon">
        {navCards.map((card) => (
          <div 
            key={card.id}
            // 4) Fixed active logic to apply .active-state to ANY active tab
            className={`nav-card ${activeTab === card.id ? 'active-state' : ''}`}
            onClick={() => setActiveTab(card.id)}
          >
            <span className="card-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="hub-workspace">
        {activeTab === 'explorer' && <EventExplorerTab />}
        {activeTab === 'update' && <UpdateEventTab />}
        {activeTab === 'new' && (
          <CreateEventTab 
            key={resumeEventId ? `resume-${resumeEventId}` : 'new-event'}
            resumeId={resumeEventId} 
            clearResume={() => setResumeEventId(null)} 
          />
        )}
        {activeTab === 'drafts' && <DraftsListTab onResume={handleResume} />}
        {activeTab === 'status' && <StatusTrackerTab />}
        {activeTab === 'trash' && <TrashTab />}
        {activeTab === 'archive' && <ArchiveTab />}
      </div>
    </div>
  );
};

export default OrgEventHub;