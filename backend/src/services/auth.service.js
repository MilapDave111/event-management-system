const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// const createUser = async ({ 
//   full_name, email, password, role, 
//   orgData = null 
// }) => {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN'); // Start transaction

//     let finalOrgId = null;

//     // 1. If ORG_ADMIN, create Organization and capture the ID
//     if (role === 'ORG_ADMIN' && orgData) {
//       const insertOrgQuery = `
//         INSERT INTO organizations 
//           (name, code, type, email, phone, address, city, state, pincode, country, status) 
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Active') 
//         RETURNING id;
//       `;
      
//       const generated_code = orgData.name.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      
//       const orgValues = [
//         orgData.name, generated_code, orgData.type, orgData.email, orgData.phone, 
//         orgData.address, orgData.city, orgData.state, orgData.pincode, orgData.country
//       ];
      
//       const orgResult = await client.query(insertOrgQuery, orgValues);
//       finalOrgId = orgResult.rows[0].id; // Capture generated ID
//     }

//     // 2. Prepare User Data
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

//     // 3. Insert User with the linked organization_id and the CORRECT role
//     const userResult = await client.query(
//       `
//       INSERT INTO users 
//         (full_name, email, password_hash, role, organization_id, verification_token, verification_token_expiry)
//       VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING id, full_name, email, role, organization_id;
//       `,
//       [full_name, email, hashedPassword, role, finalOrgId, verificationToken, tokenExpiry]
//     );

//     await client.query('COMMIT'); // Commit both inserts

//     return {
//       user: userResult.rows[0],
//       verificationToken,
//     };
//   } catch (error) {
//     await client.query('ROLLBACK'); // Rollback if either fails
//     throw error;
//   } finally {
//     client.release();
//   }
// };

const createUser = async ({ 
  full_name, email, password, role, 
  organization_id = null, // Logic: Capture the ID passed from the Standard User dropdown
  orgData = null 
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start transaction

    // Logic: Initialize with the ID provided for Standard Users. 
    // This will remain the value unless overridden by an ORG_ADMIN creation.
    let finalOrgId = organization_id; 

    // 1. If ORG_ADMIN, create Organization and capture the NEW ID
    if (role === 'ORG_ADMIN' && orgData) {
      const insertOrgQuery = `
        INSERT INTO organizations 
          (name, code, type, email, phone, address, city, state, pincode, country, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Active') 
        RETURNING id;
      `;
      
      const generated_code = orgData.name.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const orgValues = [
        orgData.name, generated_code, orgData.type, orgData.email, orgData.phone, 
        orgData.address, orgData.city, orgData.state, orgData.pincode, orgData.country
      ];
      
      const orgResult = await client.query(insertOrgQuery, orgValues);
      finalOrgId = orgResult.rows[0].id; // Override finalOrgId with the newly created ID
    }

    // 2. Prepare User Data
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 3. Insert User with the linked organization_id (Captured from dropdown OR new Org)
    const userResult = await client.query(
      `
      INSERT INTO users 
        (full_name, email, password_hash, role, organization_id, verification_token, verification_token_expiry)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, full_name, email, role, organization_id;
      `,
      [full_name, email, hashedPassword, role, finalOrgId, verificationToken, tokenExpiry]
    );

    await client.query('COMMIT'); 

    return {
      user: userResult.rows[0],
      verificationToken,
    };
  } catch (error) {
    await client.query('ROLLBACK'); 
    throw error;
  } finally {
    client.release();
  }
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
