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
   REGISTER CONTROLLER
   ====================== */
export const registerUser = async ({ full_name, email, password }) => {
  if (!full_name || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const res = await api.post("/auth/register", {
    full_name,
    email,
    password,
  });

  return res.data;
};
