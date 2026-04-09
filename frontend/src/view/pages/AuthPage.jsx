import React, { useState, useEffect } from "react";
import "../styles/AuthStyles.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../model/auth/auth.context";
import api from "../../services/api";

import {
  loginUser,
  registerUser,
} from "../../controller/auth/auth.controller";

const AuthPage = () => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [step, setStep] = useState(1); // Track registration steps
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Base Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("USER");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Password Strength State
  const [strength, setStrength] = useState({ label: "None", color: "#aaa", score: 0 });

  // Organization Specific State
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("College");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgPincode, setOrgPincode] = useState("");
  const [orgCountry, setOrgCountry] = useState("India");

  // Fetch Organizations for Dropdown
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get("/admin/organizations");
        // Ensure we are setting an array even if the response structure varies
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setOrganizations(data);
      } catch (err) {
        console.error("Dropdown load failed. Check if /api/admin/organizations is public.");
      }
    };
    if (isSignUpMode) fetchOrgs();
  }, [isSignUpMode]);

  // Password Strength Logic
  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const map = [
      { label: "Too Short", color: "#e11d48" },
      { label: "Weak", color: "#f59e0b" },
      { label: "Fair", color: "#3b82f6" },
      { label: "Good", color: "#47B599" },
      { label: "Strong", color: "#16a34a" }
    ];
    setStrength(map[score]);
  };

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ email: loginEmail, password: loginPassword });
      login({ token: data.token, user: data.user });
      toast.success("Logged in successfully");
      const routes = {
        USER: "/dashboard/user",
        ORG_ADMIN: "/dashboard/org-admin",
        SUPER_ADMIN: "/dashboard/super-admin",
        EVENT_MANAGER: "/dashboard/event-manager",
        EVENT_STAFF: "/dashboard/event-staff"
      };
      navigate(routes[data.user.role] || "/unauthorized");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  /* ---------------- REGISTER ---------------- */
  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    // Validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) return toast.error("Invalid email format");
    if (strength.score < 2) return toast.error("Password is too weak");
    if (regRole === "USER" && !selectedOrgId) return toast.error("Please select your institution");

    setIsRegistering(true);
    const payload = {
      full_name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      organization_id: regRole === "USER" ? selectedOrgId : null
    };

    if (regRole === "ORG_ADMIN") {
      Object.assign(payload, {
        org_name: orgName,
        org_type: orgType,
        org_email: orgEmail,
        org_phone: orgPhone,
        org_address: orgAddress,
        org_city: orgCity,
        org_state: orgState,
        org_pincode: orgPincode,
        org_country: orgCountry
      });
    }

    try {
      await registerUser(payload);
      toast.success("Registration successful. Please verify your email.");
      setIsSignUpMode(false);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className={`container ${isSignUpMode ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">

          {/* ---------- SIGN IN ---------- */}
          <form className="sign-in-form" onSubmit={handleLogin}>
            <h2 className="title">Sign in</h2>
            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login btn solid">Login</button>
            <p className="social-text">
              Don't have an account?
              <span className="login toggle-link" onClick={() => setIsSignUpMode(true)}>Sign up</span>
            </p>
          </form>

          {/* ---------- SIGN UP ---------- */}
          <form className="sign-up-form" onSubmit={handleRegister}>
            <h2 className="title">{step === 1 ? "Join Us" : "Institute Details"}</h2>

            {step === 1 ? (
              <>
                <div className="input-field">
                  <i className="fas fa-user"></i>
                  <input type="text" placeholder="Full Name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                </div>

                <div className="input-field">
                  <i className="fas fa-envelope"></i>
                  <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                </div>

                <div className="input-field">
                  <i className="fas fa-lock"></i>
                  <input type="password" placeholder="Password" value={regPassword} onChange={(e) => { setRegPassword(e.target.value); checkStrength(e.target.value); }} required />
                </div>
                
                {regPassword && (
                  <p style={{ color: strength.color, fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>
                    Security: {strength.label}
                  </p>
                )}

                <div className="input-field">
                  <i className="fas fa-briefcase"></i>
                  <select value={regRole} onChange={(e) => setRegRole(e.target.value)} style={{width: '100%', border: 'none', background: 'none', outline: 'none'}}>
                    <option value="USER">Standard User</option>
                    <option value="ORG_ADMIN">Register an Institute</option>
                  </select>
                </div>

                {regRole === "USER" && (
                  <div className="input-field">
                    <i className="fas fa-university"></i>
                    <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} style={{width: '100%', border: 'none', background: 'none'}} required>
                      <option value="">-- Select Institution --</option>
                      {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                )}

                <button type="button" className="signup btn" onClick={() => regRole === "ORG_ADMIN" ? setStep(2) : handleRegister()}>
                  {regRole === "ORG_ADMIN" ? "Next Step" : "Create Account"}
                </button>
              </>
            ) : (
              <div className="institute-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '500px' }}>
                <input className="mgmt-input" type="text" placeholder="Institute Name" value={orgName} onChange={e => setOrgName(e.target.value)} required />
                <select className="mgmt-input" value={orgType} onChange={e => setOrgType(e.target.value)} required>
                   <option value="College">College</option>
                   <option value="University">University</option>
                   <option value="School">School</option>
                   <option value="Institute">Institute</option>
                   <option value="Other">Other</option>
                </select>
                <input className="mgmt-input" type="email" placeholder="Official Email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} required />
                <input className="mgmt-input" type="tel" placeholder="Phone" value={orgPhone} onChange={e => setOrgPhone(e.target.value)} required />
                <input className="mgmt-input" type="text" placeholder="City" value={orgCity} onChange={e => setOrgCity(e.target.value)} required />
                <input className="mgmt-input" type="text" placeholder="State" value={orgState} onChange={e => setOrgState(e.target.value)} required />
                <input className="mgmt-input" type="text" placeholder="Pincode" value={orgPincode} onChange={e => setOrgPincode(e.target.value)} required />
                <input className="mgmt-input" type="text" placeholder="Address"  value={orgAddress} onChange={e => setOrgAddress(e.target.value)} required />
                
                <div style={{gridColumn: '1 / span 2', display: 'flex', gap: '10px'}}>
                   <button type="button" className="login btn" onClick={() => setStep(1)} style={{flex: 1, background: '#64748b'}}>Back</button>
                   <button type="submit" className="signup btn" style={{flex: 2}} disabled={isRegistering}>
                     {isRegistering ? "Registering..." : "Finalize"}
                   </button>
                </div>
              </div>
            )}

            <p className="social-text">
              Already have an account?
              <span className="signup toggle-link" onClick={() => setIsSignUpMode(false)}>Sign in</span>
            </p>
          </form>

        </div>
      </div>

      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>Welcome!</h3>
            <p>Your platform for secure and smart event management.</p>
          </div>
          <img src="https://i.ibb.co/6HXL6q1/log.png" className="image" alt="login" />
        </div>
        <div className="panel right-panel">
          <div className="content">
            <h3>Join us!</h3>
            <p>Create your account and start managing events.</p>
          </div>
          <img src="/img/register.svg" className="image" alt="register" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;