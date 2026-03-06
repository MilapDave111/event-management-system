import React, { useState, useEffect } from 'react';
import { useAuth } from '../../model/auth/auth.context';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../styles/Layout.css';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAssignedAsManager, setIsAssignedAsManager] = useState(false);

  // 1. Identify if we are currently in a Manager-related route
  const isManagerView = location.pathname.includes('/manager') || location.pathname.includes('event-manager');

  // 2. Check if the Org Admin is actually assigned to any events as a manager
  useEffect(() => {
    const checkManagerStatus = async () => {
      if (user?.role === 'ORG_ADMIN') {
        try {
          const res = await api.get('/events/managed-events');
          // If they have at least one event assigned, they can use the Manager View
          const hasEvents = res.data.success ? res.data.data.length > 0 : res.data.length > 0;
          setIsAssignedAsManager(hasEvents);
        } catch (err) {
          console.error("Status check failed", err);
          setIsAssignedAsManager(false);
        }
      }
    };
    checkManagerStatus();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate('/auth');
  };

  return (
    <div className="main-wrapper">
      <aside className="sidebar-base" style={{ width: isCollapsed ? '80px' : '280px' }}>
        <div className="sidebar-logo-area">
          {!isCollapsed && <h2 className="sidebar-logo-text">SOEMS</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-collapse-btn">
            {isCollapsed ? '⮕' : '⬅'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* 3. SWITCH VIEW BUTTON: Only for ORG_ADMINs who are also Managers */}
          {user?.role === 'ORG_ADMIN' && isAssignedAsManager && (
            <div style={{ padding: '0 15px', marginBottom: '15px' }}>
              <button
                onClick={() => navigate(isManagerView ? '/dashboard/org-admin' : '/dashboard/event-manager')}
                style={{
                  width: '100%', padding: '10px', backgroundColor: isManagerView ? '#47B599' : '#1e293b',
                  color: 'white', borderRadius: '8px', border: '1px solid #47B599', cursor: 'pointer',
                  fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {isCollapsed ? '🔄' : (isManagerView ? '🏢 Admin Dashboard' : '👔 Manager Dashboard')}
              </button>
            </div>
          )}

          {/* --- ADMIN / GENERAL LINKS --- */}
          {(!isManagerView) && (
            <>
              <NavLink 
  to={
    user?.role === 'SUPER_ADMIN' ? '/dashboard/super-admin' : 
    user?.role === 'ORG_ADMIN' ? '/dashboard/org-admin' : 
    user?.role === 'EVENT_STAFF' ? '/dashboard/event-staff' : 
    user?.role === 'EVENT_MANAGER' ? '/dashboard/event-manager' :
    '/dashboard/user'
  } 
  className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
>
  <span className="sidebar-icon">📊</span>
  {!isCollapsed && "Dashboard Overview"}
</NavLink>

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                <NavLink to="/manage-events" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                  <span className="sidebar-icon">{user?.role === 'SUPER_ADMIN' ? '📢' : '📅'}</span>
                  {!isCollapsed && (user?.role === 'SUPER_ADMIN' ? "Moderate Events" : "Events")}
                </NavLink>
              )}

              {user?.role === 'ORG_ADMIN' && (
                <NavLink to="/org/manage-members" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                  <span className="sidebar-icon">🛡️</span>
                  {!isCollapsed && "Role Management"}
                </NavLink>
              )}
            </>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              {/* ... keep existing links ... */}

              {/* --- START OF MILAP'S CODE --- */}
              <NavLink to="/superadmin/organizations" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">🏢</span>
                {!isCollapsed && "Institutions"}
              </NavLink>

              <NavLink to="/superadmin/users" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                {!isCollapsed && "System Users"}
              </NavLink>

              <NavLink to="/admin/logs" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📜</span>
                {!isCollapsed && "Audit Logs"}
              </NavLink>
              {/* --- END OF MILAP'S CODE --- */}
            </>
          )}

          {/* --- MANAGER SPECIFIC LINKS --- */}
          {(user?.role === 'EVENT_MANAGER' || (user?.role === 'ORG_ADMIN' && isManagerView)) && (
            <>
              <NavLink to="/dashboard/event-manager" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📊</span>
                {!isCollapsed && " Dashboard Overview"}
              </NavLink>
              <NavLink to="/manager/event-hub" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📅</span>
                {!isCollapsed && "Events"}
              </NavLink>
              <NavLink to="/manager/manage-staff" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                {!isCollapsed && "Staff Onboarding"}
              </NavLink>
              <NavLink to="/manager/tasks" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📋</span>
                {!isCollapsed && "Task Assignment"}
              </NavLink>
            </>
          )}
          {/* --- EVENT STAFF SIDEBAR LINKS --- */}
{user?.role === 'EVENT_STAFF' && (
  <>
   
    
    <NavLink 
      to="/staff/event-hub" 
      className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
    >
      <span className="sidebar-icon">📅</span>
      {!isCollapsed && "Events"}
    </NavLink>
  </>
)}

          <NavLink to="/profile" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <span className="sidebar-icon">👤</span>
            {!isCollapsed && "My Profile"}
          </NavLink>
        </nav>



        <div className="sidebar-footer">
          <button onClick={handleLogout} className={isCollapsed ? "logout-btn-small" : "logout-btn-full"}>
            <span>🚪</span>
            {!isCollapsed && <span style={{ marginLeft: '10px' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="content-container">
        <header className="app-header">
          <div className="header-left">
            <span className="role-tag" style={{ backgroundColor: isManagerView ? '#47B599' : '' }}>
              {/* 4. DYNAMIC TAG: Only shows 'Acting' if the user is an Admin stepping into Manager shoes */}
              {isManagerView && user?.role === 'ORG_ADMIN'
                ? 'EVENT MANAGER (Acting)'
                : user?.role?.replace('_', ' ')}
            </span>
          </div>
          <div className="header-right">Welcome back, <strong>{user?.full_name}</strong></div>
        </header>
        <main className="main-scroll-area">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;