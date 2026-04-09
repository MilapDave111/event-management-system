const pool = require("../config/db");
const authService = require("../services/auth.service");
const ROLES = require("../utils/roles");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const logService = require("../services/admin/logService");

/* =========================
   REGISTER (WITH EMAIL VERIFICATION)
   ========================= */
// const register = async (req, res) => {
//   try {
//     const { 
//       full_name, email, password, role,
//       org_name, org_type, org_email, org_phone,
//       org_address, org_city, org_state, org_pincode, org_country 
//     } = req.body;

//     if (!full_name || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const existingUser = await authService.findUserByEmail(email);
//     if (existingUser) {
//       return res.status(409).json({ message: "Email already exists" });
//     }

//     // Pass the role and org details to the service
//     const { user, verificationToken } = await authService.createUser({
//       full_name,
//       email,
//       password,
//       role: role || 'USER', // Preserves ORG_ADMIN if selected
//       orgData: role === 'ORG_ADMIN' ? {
//         name: org_name, type: org_type, email: org_email, phone: org_phone,
//         address: org_address, city: org_city, state: org_state, 
//         pincode: org_pincode, country: org_country
//       } : null
//     });

//     // Your original verification email logic
//     const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;

//     await sendEmail({
//       to: email,
//       subject: "Verify your email - SOEMS",
//       text: `Welcome to SOEMS!\n\nPlease verify your email by clicking the link below:\n\n${verifyLink}`,
//     });
// await logService.createLog(user.id, 'USER_REGISTER', null, `New account registered as ${role}`);
//     res.status(201).json({
//       message: "Registration successful. Please verify your email.",
//     });
//   } catch (error) {
//     console.error("REGISTER ERROR:", error);
//     res.status(500).json({ message: "Registration failed" });
//   }
// };

const register = async (req, res) => {
  try {
    const { 
      full_name, email, password, role, 
      organization_id, // TASK 9 Addition
      org_name, org_type, org_email, org_phone,
      org_address, org_city, org_state, org_pincode, org_country 
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const { user, verificationToken } = await authService.createUser({
      full_name,
      email,
      password,
      role: role || 'USER',
      organization_id: role === 'USER' ? organization_id : null, // TASK 9 Logic
      orgData: role === 'ORG_ADMIN' ? {
        name: org_name, type: org_type, email: org_email, phone: org_phone,
        address: org_address, city: org_city, state: org_state, 
        pincode: org_pincode, country: org_country
      } : null
    });

    const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${verificationToken}`;
     sendEmail({
      to: email,
      subject: "Verify your email - SOEMS",
      text: `Welcome to SOEMS!\n\nPlease verify your email by clicking the link below:\n\n${verifyLink}`,
    });

    await logService.createLog(user.id, 'USER_REGISTER', null, `New account registered as ${role}`);
    res.status(201).json({ message: "Registration successful. Please verify your email." });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* =========================
   MERGED REGISTER (WITH DUAL-TABLE INSERT)
   ========================= */


/* =========================
   VERIFY EMAIL
   ========================= */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify-email?status=failed`
      );
    }

    const userId = await authService.verifyEmailToken(token);

    if (!userId) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify-email?status=failed`
      );
    }

    // ✅ Success → redirect to frontend page
    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?status=success`
    );
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/verify-email?status=failed`
    );
  }
};


/* =========================
   LOGIN (BLOCK UNVERIFIED USERS)
   ========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔒 Block login if email not verified
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(

      { id: user.id, role: user.role, organization_id: user.organization_id },

      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
await logService.createLog(user.id, 'USER_LOGIN', null, `User logged in successfully`);
    res.status(200).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
};
