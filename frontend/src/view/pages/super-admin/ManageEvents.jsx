import React from 'react';
import { useAuth } from '../../../model/auth/auth.context';
import ModerateEvents from './ModerateEvents';
import OrgEventHub from '../org-admin/OrgEventHub';

const ManageEvents = () => {
  const { user } = useAuth();

  // Functional Rights Enforcement: Serve UI based on Role
  if (user?.role === 'SUPER_ADMIN') {
    return <ModerateEvents />;
  }

  if (user?.role === 'ORG_ADMIN') {
    return <OrgEventHub />;
  }

  return (
    <div className="page-container">
      <div className="event-card">
        <h3>Access Restricted</h3>
        <p>You do not have the necessary permissions to manage events.</p>
      </div>
    </div>
  );
};

export default ManageEvents;