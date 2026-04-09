import React, { useEffect, useState } from "react"; 
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/AuthStyles.css";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  
  // FIX: Added the missing state variable for the countdown
  const [countdown, setCountdown] = useState(5); 

  const status = params.get("status");
  const isSuccess = status === "success";

  useEffect(() => {
    let timer;
    if (isSuccess) {
      // Logic: Countdown for automatic redirect to login
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

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f8fafc", 
      position: "relative",
      zIndex: 1
    }}>
      <div className="mgmt-card" style={{ 
        maxWidth: '450px', 
        width: '90%',
        textAlign: 'center', 
        padding: '50px', 
        background: '#fff', 
        borderRadius: '24px', 
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        zIndex: 10 
      }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>
          {isSuccess ? "✅" : "❌"}
        </div>

        <h2 style={{ fontSize: '1.8rem', color: '#334155', marginBottom: '15px' }}>
          {isSuccess ? "Account Verified!" : "Verification Failed"}
        </h2>

        <p style={{ marginBottom: '25px', color: '#64748b', lineHeight: '1.6' }}>
          {isSuccess
            ? "Your email has been successfully verified. You can now access all features of SOEMS."
            : "This verification link is invalid, has expired, or has already been used."}
        </p>

        {isSuccess && (
          <div style={{ marginBottom: '25px', fontSize: '14px', color: '#47B599', fontWeight: 'bold' }}>
            Redirecting to login in {countdown}s...
          </div>
        )}

        <button
          className={isSuccess ? "login btn" : "signup btn"}
          style={{ width: '100%', margin: 0, padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
          onClick={() => navigate("/auth")}
        >
          {isSuccess ? "Login Now" : "Back to Signup"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;