import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../styles/Profile.css'; // Importing the new CSS

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast.error("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (isLoading) return <div className="profile-page-wrapper">Loading profile...</div>;
  if (!profile) return <div className="profile-page-wrapper" style={{color: 'red'}}>Error loading profile.</div>;

  const initial = profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '?';
  const displayRole = profile.role ? profile.role.replace('_', ' ') : 'USER';

  return (
    <div className="profile-page-wrapper">
      <h2 className="profile-title">My Profile</h2>
      
      <div className="profile-card">
        <div className="profile-banner"></div>

        <div className="profile-overlap-section">
            <div className="profile-avatar">{initial}</div>
            <div style={{ paddingBottom: '5px' }}>
              <span className="role-badge">{displayRole}</span>
            </div>
        </div>

        <div className="profile-details-container">
          <h3 className="section-label">Account Information</h3>
          
          <div className="info-grid">
            {/* Email Card */}
            <div className="info-card">
              <span className="info-card-label">Registered Email</span>
              <div className="info-value-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>{profile.email}</span>
              </div>
            </div>

            {/* Status Card */}
            <div className="info-card">
              <span className="info-card-label">Verification Status</span>
              <div>
                {profile.is_verified ? (
                  <span className="status-badge-verified">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle><path d="M9 11l3 3L22 4" fill="none" stroke="#fff" strokeWidth="3"/></svg>
                    Verified Account
                  </span>
                ) : (
                  <span className="status-badge-verified" style={{backgroundColor: '#fef3c7', color: '#b45309'}}>
                    ⚠ Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;