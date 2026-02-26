import React, { useState } from 'react';
import { useAuth } from '../../model/auth/auth.context';
import { useNavigate, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/Layout.css';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate('/auth');
  };

  return (
    <div className="main-wrapper">
      {/* SIDEBAR */}
      <aside className="sidebar-base" style={{ width: isCollapsed ? '80px' : '280px' }}>
        <div className="sidebar-logo-area">
          {!isCollapsed && <h2 className="sidebar-logo-text">SOEMS</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-collapse-btn">
            {isCollapsed ? '⮕' : '⬅'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to={user?.role === 'SUPER_ADMIN' ? '/dashboard/super-admin' : user?.role === 'ORG_ADMIN' ? '/dashboard/org-admin' : '/dashboard/user'}
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <span className="sidebar-icon">📊</span>
            {!isCollapsed && "Dashboard Overview"}
          </NavLink>

          {user?.role === 'SUPER_ADMIN' && (
            <>
              <NavLink to="/superadmin/organizations" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">🏢</span>
                {!isCollapsed && "Institutions"}
              </NavLink>
              <NavLink to="/superadmin/users" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
                <span className="sidebar-icon">👥</span>
                {!isCollapsed && "System Users"}
              </NavLink>
            </>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
            <NavLink to="/manage-events" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
              <span className="sidebar-icon">{user?.role === 'SUPER_ADMIN' ? '📢' : '➕'}</span>
              {!isCollapsed && (user?.role === 'SUPER_ADMIN' ? "Moderate Events" : "Manage Events")}
            </NavLink>
          )}

          <NavLink to="/profile" className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}>
            <span className="sidebar-icon">👤</span>
            {!isCollapsed && "My Profile"}
          </NavLink>
        </nav>

        {/* FOOTER - USER PROFILE + LOGOUT */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="user-brief">
              <div className="user-avatar">{user?.full_name?.charAt(0) || 'U'}</div>
              <div className="user-info">
                <p className="user-name">{user?.full_name?.split(' ')[0]}</p>
                <p className="user-role">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className={isCollapsed ? "logout-btn-small" : "logout-btn-full"}>
            <span>🚪</span>
            {!isCollapsed && <span style={{ marginLeft: '10px' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="content-container">
        <header className="app-header">
          <div className="header-left">
            <span className="role-tag">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="header-right">
            Welcome back, <strong>{user?.full_name}</strong>
          </div>
        </header>
        <main className="main-scroll-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;