import { useSearchParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = params.get("status");

  const isSuccess = status === "success";

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>{isSuccess ? "✅" : "❌"}</div>

        <h2>
          {isSuccess
            ? "Email verified successfully"
            : "Email verification failed"}
        </h2>

        <p>
          {isSuccess
            ? "Your account has been activated. You can now log in."
            : "The verification link is invalid or expired."}
        </p>

        <button
          style={styles.button}
          onClick={() => navigate("/auth")}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f9fafb",
  },
  card: {
    padding: "40px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
    maxWidth: "420px",
  },
  icon: {
    fontSize: "48px",
    marginBottom: "10px",
  },
  button: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default VerifyEmail;
