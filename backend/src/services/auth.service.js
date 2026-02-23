const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const createUser = async ({ full_name, email, password, role }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const result = await pool.query(
    `
    INSERT INTO users 
      (full_name, email, password_hash, role, verification_token, verification_token_expiry)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, full_name, email, role, is_verified
    `,
    [
      full_name,
      email,
      hashedPassword,
      role,
      verificationToken,
      tokenExpiry,
    ]
  );

  return {
    user: result.rows[0],
    verificationToken,
  };
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};



const verifyEmailToken = async (token) => {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE verification_token = $1
      AND verification_token_expiry > NOW()
    `,
    [token]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const userId = result.rows[0].id;

  await pool.query(
    `
    UPDATE users
    SET is_verified = TRUE,
        verification_token = NULL,
        verification_token_expiry = NULL
    WHERE id = $1
    `,
    [userId]
  );

  return userId;
};

module.exports = {
  createUser,
  findUserByEmail,
  verifyEmailToken,
};
