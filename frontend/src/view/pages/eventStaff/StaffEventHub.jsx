import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../../services/api';
import StaffMyEventsTab from "./tabs/StaffMyEventsTab";
import EventExplorerTab from '../org-admin/tabs/EventExplorerTab'; 
import StaffRegistrationsTab from './tabs/StaffRegistrationsTab';
import StaffViewTeamTab from './tabs/StaffViewTeamTab';
import StaffScanTab from './tabs/StaffScanTab';
import StaffAttendeesTab from './tabs/StaffAttendeesTab';
import toast from 'react-hot-toast';
import "../../styles/GlobalHub.css"; 

const StaffEventHub = () => {
  // CRITICAL FIX: Initialize location BEFORE using it for the state
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'assigned');
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'assigned' || activeTab === 'scan' || activeTab === 'attendees') {
        fetchAssignedEvents();
    }
  }, [activeTab]);
  
  const fetchAssignedEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events/assigned-events'); 
      const eventData = res.data.success ? res.data.data : res.data;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      toast.error("Could not load your assigned events");
    } finally {
      setLoading(false);
    }
  };

  const navCards = [
    { id: 'assigned', label: 'My Assignments' },
    { id: 'explorer', label: 'Event Explorer' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'view-team', label: 'Team Details' },
    { id: 'scan', label: 'Scan Ticket' },
    { id: 'attendees', label: 'View Attendees' }
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
        {activeTab === 'assigned' && <StaffMyEventsTab events={events} loading={loading} />}
        {activeTab === 'explorer' && <EventExplorerTab />}
        {activeTab === 'registrations' && <StaffRegistrationsTab />}
        {activeTab === 'view-team' && <StaffViewTeamTab />} 
        {activeTab === 'scan' && <StaffScanTab events={events} />} 
        {activeTab === 'attendees' && <StaffAttendeesTab events={events} />} 
      </div>
    </div>
  );
};

export default StaffEventHub;