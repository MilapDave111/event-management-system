import React, { useEffect, useState } from "react"; 
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/AuthStyles.css";// Corrected Filename & Path
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get("status");

  const isSuccess = status === "success";
useEffect(() => {
    let timer;
    if (isSuccess) {
      // Logic: Countdown for automatic redirect
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/auth");
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, navigate]);

  return (/* We use a unique style object here to stop the big green circle from appearing */
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8fafc", /* Clean light grey background */
      position: "relative",
      zIndex: 1
    }}>
      <div className="mgmt-card" style={{ 
        maxWidth: '450px', 
        textAlign: 'center', 
        padding: '50px', 
        background: '#fff', 
        borderRadius: '24px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        zIndex: 10 /* Ensures it stays above everything */
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>
          {isSuccess ? "✅" : "❌"}
        </div>

        <h2 className="title" style={{ fontSize: '1.8rem', color: '#334155' }}>
          {isSuccess ? "Account Verified!" : "Verification Failed"}
        </h2>

        <p className="social-text" style={{ marginBottom: '25px', color: '#64748b' }}>
          {isSuccess
            ? "Your email has been successfully verified. You can now access all features of SOEMS."
            : "This verification link is invalid, has expired, or has already been used."}
        </p>

        {isSuccess && (
          <div className="strong-password" style={{ marginBottom: '25px', fontSize: '14px' }}>
            Redirecting to login in {countdown}s...
          </div>
        )}

        <button
          className={isSuccess ? "login btn" : "signup btn"}
          style={{ width: '100%', margin: 0 }}
          onClick={() => navigate("/auth")}
        >
          {isSuccess ? "Login Now" : "Back to Signup"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;