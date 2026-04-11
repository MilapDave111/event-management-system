import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import MyEventsTab from "./tabs/MyEventsTab.jsx";
import EventExplorerTab from '../org-admin/tabs/EventExplorerTab';
import RegistrationsTab from '../eventManager/tabs/RegistrationsTab';
import AssignStaffTab from '../eventManager/tabs/AssignStaffTab'; // <-- 1. IMPORT THE NEW TAB
import toast from 'react-hot-toast';
import "../../styles/GlobalHub.css"; 
import "../../styles/Form.css";
import "../../styles/Dashboard.css";
import ViewTeamTab from './tabs/ViewTeamTab';

const ManagerEventHub = () => {
  const [activeTab, setActiveTab] = useState('managed');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'managed') {
      fetchManagedEvents();
    }
  }, [activeTab]);
  
  const fetchManagedEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events/managed-events');
      const eventData = res.data.success ? res.data.data : res.data;
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err) {
      toast.error("Could not load your assigned events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // <-- 2. ADD THE NEW TAB TO THE TOP MENU
  const navCards = [
  { id: 'managed', label: 'My Managed Events' },
  { id: 'explorer', label: 'Event Explorer' },
  { id: 'registrations', label: 'View Registrations' },
  { id: 'assign-staff', label: 'Assign Staff' },
  { id: 'view-team', label: 'View Team' } // Add this 5th tab
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
  {activeTab === 'managed' && <MyEventsTab events={events} loading={loading} />}
  {activeTab === 'explorer' && <EventExplorerTab />}
  {activeTab === 'registrations' && <RegistrationsTab />}
  {activeTab === 'assign-staff' && <AssignStaffTab />}
  {activeTab === 'view-team' && <ViewTeamTab />} 
</div>
    </div>
  );
};

export default ManagerEventHub;