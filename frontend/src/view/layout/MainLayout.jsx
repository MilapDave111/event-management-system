import React, { useState } from 'react';
import { useAuth } from '../../model/auth/auth.context';
import { useNavigate, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    navigate('/auth');
  };

  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <div style={styles.wrapper}>
      {/* SIDEBAR */}
      <aside style={{ ...styles.sidebar, width: sidebarWidth }}>
        <div style={styles.logoArea}>
          {!isCollapsed && <h2 style={styles.logoText}>SOEMS</h2>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={styles.collapseBtn}>
            {isCollapsed ? '⮕' : '⬅'}
          </button>
        </div>

        <nav style={styles.navLinks}>
          <NavLink
            to={user?.role === 'SUPER_ADMIN' ? '/dashboard/super-admin' : user?.role === 'ORG_ADMIN' ? '/dashboard/org-admin' : '/dashboard/user'}
            style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
          >
            <span style={styles.icon}>📊</span>
            {!isCollapsed && "Dashboard Overview"}
          </NavLink>

          {/* SUPER ADMIN SPECIFIC LINKS */}
          {user?.role === 'SUPER_ADMIN' && (
            <>
              <NavLink to="/superadmin/organizations" style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}>
                <span style={styles.icon}>🏢</span>
                {!isCollapsed && "Institutions"}
              </NavLink>
              <NavLink to="/superadmin/users" style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}>
                <span style={styles.icon}>👥</span>
                {!isCollapsed && "System Users"}
              </NavLink>
            </>
          )}

          {/* SHARED MANAGE EVENTS LINK (CENTRALIZED) */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ORG_ADMIN') && (
            <NavLink 
              to="/manage-events" 
              style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
            >
              <span style={styles.icon}>{user?.role === 'SUPER_ADMIN' ? '📢' : '➕'}</span>
              {!isCollapsed && (user?.role === 'SUPER_ADMIN' ? "Moderate Events" : "Manage Events")}
            </NavLink>
          )}

          <NavLink to="/profile" style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}>
            <span style={styles.icon}>👤</span>
            {!isCollapsed && "My Profile"}
          </NavLink>
        </nav>

        <div style={styles.sidebarFooter}>
          {!isCollapsed && (
            <div style={styles.userBrief}>
              <div style={styles.avatar}>{user?.full_name?.charAt(0) || 'U'}</div>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user?.full_name?.split(' ')[0]}</p>
                <p style={styles.userRole}>{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={isCollapsed ? styles.logoutBtnSmall : styles.logoutBtnFull}>
            <span>🚪</span>
            {!isCollapsed && <span style={{marginLeft: '10px'}}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div style={styles.container}>
        <header style={styles.header}>
           <div style={styles.headerLeft}><span style={styles.roleTag}>{user?.role?.replace('_', ' ')}</span></div>
           <div style={styles.headerRight}>Welcome back, <strong>{user?.full_name}</strong></div>
        </header>
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', height: '100vh', width: '100vw', background: '#f1f5f9', overflow: 'hidden' },
  sidebar: { background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', boxShadow: '4px 0 20px rgba(0,0,0,0.05)', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 100 },
  logoArea: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' },
  logoText: { color: '#47B599', fontWeight: '900', fontSize: '22px', letterSpacing: '-1px' },
  collapseBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', padding: '5px' },
  navLinks: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  link: { display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#64748b', padding: '12px 14px', borderRadius: '12px', fontWeight: '600', transition: '0.2s ease', whiteSpace: 'nowrap' },
  activeLink: { background: 'linear-gradient(135deg, #47B599 0%, #3da188 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(71, 181, 153, 0.3)' },
  icon: { fontSize: '18px', marginRight: '12px' },
  sidebarFooter: { borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: 'auto' },
  userBrief: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  avatar: { width: '32px', height: '32px', background: '#47B599', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  userInfo: { overflow: 'hidden' },
  userName: { margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' },
  userRole: { margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' },
  logoutBtnFull: { width: '100%', padding: '12px', background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoutBtnSmall: { width: '100%', padding: '12px', background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' },
  container: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { height: '80px', background: 'linear-gradient(90deg, #47B599, #04befe)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 50 },
  roleTag: { background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '30px', fontSize: '10px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' }
};

export default MainLayout;