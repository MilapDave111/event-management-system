import React, { useState, useEffect } from 'react';
import { useAuth } from '../../model/auth/auth.context';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../styles/Layout.css';
import AiHelpDesk from '../components/AiHelpDesk';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NEW: Mobile drawer state
  const [isAssignedAsManager, setIsAssignedAsManager] = useState(false);

  
// Freny Fix: Ensures dashboard visibility logic works for both Managers and Staff
  const isManagerView = (user?.role === 'ORG_ADMIN' || user?.role === 'EVENT_MANAGER') && 
                        (location.pathname.includes('/manager') || location.pathname.includes('event-manager'));
  useEffect(() => {
    const checkManagerStatus = async () => {
      if (user?.role === 'ORG_ADMIN') {
        try {
          const res = await api.get('/events/managed-events');
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate('/auth');
  };

  return (
    <div className={`main-wrapper ${isMobileMenuOpen ? 'mobile-nav-open' : ''}`}>
      {/* NEW: Mobile Toggle Button */}
      <button 
        className="mobile-nav-toggle" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* NEW: Background Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside 
        className={`sidebar-base ${isMobileMenuOpen ? 'show-mobile' : ''}`} 
        style={{ width: isCollapsed ? '80px' : '280px' }}
      >
        <div className="sidebar-logo-area">
          {!isCollapsed && <h2 className="sidebar-logo-text">SOEMS</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-collapse-btn desktop-only">
            {isCollapsed ? '⮕' : '⬅'}
          </button>
        </div>

        <nav className="sidebar-nav">
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
                {isCollapsed ? '🔄' : (isManagerView ? '🏢 Admin View' : '👔 Manager View')}
              </button>
            </div>
          )}

          {!isManagerView && (
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
                {!isCollapsed && "Dashboard"}
              </NavLink>

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
                <NavLink to="/manage-events" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                  <span className="sidebar-icon">{user?.role === 'SUPER_ADMIN' ? '📢' : '📅'}</span>
                  {!isCollapsed && (user?.role === 'SUPER_ADMIN' ? "Moderation" : "Events")}
                </NavLink>
              )}

              {user?.role === 'ORG_ADMIN' && (
                <NavLink to="/org/manage-members" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                  <span className="sidebar-icon">🛡️</span>
                  {!isCollapsed && "Roles"}
                </NavLink>
              )}
            </>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <>
              <NavLink to="/superadmin/organizations" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">🏢</span>
                {!isCollapsed && "Institutions"}
              </NavLink>
              <NavLink to="/superadmin/users" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                {!isCollapsed && "Users"}
              </NavLink>
              <NavLink to="/admin/logs" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📜</span>
                {!isCollapsed && "Audit"}
              </NavLink>
            </>
          )}

          {(user?.role === 'EVENT_MANAGER' || (user?.role === 'ORG_ADMIN' && isManagerView)) && (
            <>
              <NavLink to="/dashboard/event-manager" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📊</span>
                {!isCollapsed && "Manager Home"}
              </NavLink>
              <NavLink to="/manager/event-hub" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📅</span>
                {!isCollapsed && "Events"}
              </NavLink>
              <NavLink to="/manager/manage-staff" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                {!isCollapsed && "Manage Staff"}
              </NavLink>
              <NavLink to="/manager/tasks" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📋</span>
                {!isCollapsed && "Tasks"}
              </NavLink>
            </>
          )}
{user?.role === 'EVENT_STAFF' && (
            <>
              <NavLink to="/staff/event-hub" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📅</span>
                {!isCollapsed && "Assigned Events"}
              </NavLink>
              {/* Freny Integration: Direct access to Kanban for Staff */}
              <NavLink to="/manager/tasks" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">📋</span>
                {!isCollapsed && "My Tasks"}
              </NavLink>
            </>
          )}
          <NavLink to="/profile" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <span className="sidebar-icon">👤</span>
            {!isCollapsed && "Profile"}
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
            <span className="role-tag">
              {isManagerView && user?.role === 'ORG_ADMIN' ? 'ACTING MANAGER' : user?.role?.replace('_', ' ')}
            </span>
          </div>
          <div className="header-right"><strong>{user?.full_name}</strong></div>
        </header>
        <main className="main-scroll-area" style={{ width: '100%', display: 'block' }}>
  {children}
</main>
      </div>
      <AiHelpDesk/>
    </div>
  );
};

export default MainLayout;