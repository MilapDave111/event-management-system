import React, { useState } from 'react';
import CreateEventTab from './tabs/CreateEventTab';
import UpdateEventTab from './tabs/UpdateEventTab';
import DraftsListTab from './tabs/DraftsListTab';
import StatusTrackerTab from './tabs/StatusTrackerTab';
import '../../styles/GlobalHub.css'; // New responsive hub styles
import '../../styles/Form.css'; //

const OrgEventHub = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [resumeEventId, setResumeEventId] = useState(null);

  const handleResume = (id) => {
    setResumeEventId(id); 
    setActiveTab('new'); 
  };

  const navCards = [
    { id: 'new', label: '+New Event' },
    { id: 'update', label: 'Update Event Details' },
    { id: 'drafts', label: 'Drafts' },
    { id: 'status', label: 'Status' },
  ];

  return (
    <div className="org-hub-container">
      <div className="management-ribbon">
        {navCards.map((card) => (
          <div 
            key={card.id}
            className={`nav-card ${activeTab === card.id ? (card.id === 'new' ? 'active-yellow' : 'active-tab') : ''}`}
            onClick={() => setActiveTab(card.id)}
          >
            <span className="card-label">{card.label}</span>
          </div>
        ))}
      </div>

      

      <div className="hub-workspace">
        {/* {activeTab === 'new' && <CreateEventTab />} */}
        {activeTab === 'update' && <UpdateEventTab />}
        {activeTab === 'new' && (
          <CreateEventTab 
            /* The KEY is the secret: it forces a re-mount so forms don't stack */
            key={resumeEventId ? `resume-${resumeEventId}` : 'new-event'}
            resumeId={resumeEventId} 
            clearResume={() => setResumeEventId(null)} 
          />
        )}
        {activeTab === 'drafts' && <DraftsListTab onResume={handleResume} />}
        {activeTab === 'status' && <StatusTrackerTab />}
      </div>
    </div>
  );
};

export default OrgEventHub;