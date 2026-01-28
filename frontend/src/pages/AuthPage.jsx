import React, { useState } from "react";
import "../assets/css/AuthStyles.css";
import api from "../services/api";
import toast from "react-hot-toast";

const AuthPage = () => {
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  /* ---------------- LOGIN ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.token);
      toast.success("Logged in successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  /* ---------------- REGISTER ---------------- */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsRegistering(true);

    try {
      await api.post("/auth/register", {
        full_name: regName,     // ✅ SOEMS FIELD
        email: regEmail,
        password: regPassword,
      });

      toast.success("Registration successful. Please log in.");
      setIsSignUpMode(false);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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
              <i className="fas fa-user"></i>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login btn solid">
              Login
            </button>

            <p className="social-text">
              Don&apos;t have an account?
              <span
                className="login toggle-link"
                onClick={() => setIsSignUpMode(true)}
              >
                Sign up
              </span>
            </p>
          </form>

          {/* ---------- SIGN UP ---------- */}
          <form className="sign-up-form" onSubmit={handleRegister}>
            <h2 className="title">Sign up</h2>

            <div className="input-field">
              <i className="fas fa-user"></i>
              <input
                type="text"
                placeholder="Full Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="input-field">
              <i className="fas fa-envelope"></i>
              <input
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-field">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="signup btn solid"
              disabled={isRegistering}
            >
              {isRegistering ? "Creating..." : "Sign up"}
            </button>

            <p className="social-text">
              Already have an account?
              <span
                className="signup toggle-link"
                onClick={() => setIsSignUpMode(false)}
              >
                Sign in
              </span>
            </p>
          </form>

        </div>
      </div>

      {/* ---------- PANELS ---------- */}
      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>Welcome!</h3>
            <p>Your platform for secure and smart event management.</p>
          </div>
          <img
            src="https://i.ibb.co/6HXL6q1/log.png"
            className="image"
            alt="login"
          />
        </div>

        <div className="panel right-panel">
          <div className="content">
            <h3>Join us!</h3>
            <p>Create your account and start managing events.</p>
          </div>
          <img
  src="/img/register.svg"
  className="image"
  alt="register"
/>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
