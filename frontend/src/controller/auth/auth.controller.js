import api from "../../services/api";

/* ======================
   LOGIN CONTROLLER
   ====================== */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const res = await api.post("/auth/login", {
    email,
    password,
  });

  return res.data;
};

/* ======================
   REGISTER CONTROLLER (UPDATED)
   ====================== */
// Accept the full data object from AuthPage.jsx
export const registerUser = async (userData) => {
  const { full_name, email, password } = userData;

  if (!full_name || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Send the entire object to the backend
  const res = await api.post("/auth/register", userData);

  return res.data;
};