const pool = require("../../config/db");
const logService = require('../../services/admin/logService');
// const getUsers = async (req, res) => {
//   try {
    
//     const result = await pool.query(
//       `SELECT u.id, u.full_name, u.email, u.role, u.organization_id, o.name as organization_name 
//        FROM users u LEFT JOIN organizations o ON u.organization_id = o.id 
//        WHERE u.is_active = TRUE ORDER BY u.created_at DESC`
//     );
//     res.status(200).json(result.rows);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const getUsers = async (req, res) => {
  try {
    // --- START OF MILAP'S CODE (Query Parameters) ---
    const { search, role } = req.query;
    // --- END OF MILAP'S CODE ---

    // Base query including your organization join logic
    let query = `
      SELECT u.id, u.full_name, u.email, u.role, u.organization_id, o.name as organization_name 
      FROM users u LEFT JOIN organizations o ON u.organization_id = o.id 
      WHERE u.is_active = TRUE`;
    
    const params = [];

    // --- START OF MILAP'S CODE (Dynamic SQL Building) ---
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (role) {
      params.push(role);
      query += ` AND u.role = $${params.length}`;
    }
    // --- END OF MILAP'S CODE ---

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateUserRole = async (req, res) => {
  const { userId, role, organizationId } = req.body;
  const adminId = req.user.id; // From auth middleware

  try {
    // --- START OF MILAP'S CODE ---
    // Protect existing Super Admins from being changed by others
    const userCheck = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (userCheck.rows[0]?.role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: "System Protection: Cannot modify Super Admin account." });
    }
    // --- END OF MILAP'S CODE ---

    await pool.query(
      `UPDATE users SET role = $1, organization_id = $2 WHERE id = $3`, 
      [role, organizationId || null, userId]
    );

    // --- START OF MILAP'S CODE ---
    await logService.createLog(
        adminId, 
        'UPDATE_USER_ROLE', 
        Number(userId), 
        `Role updated to ${role}`
    );
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // --- START OF MILAP'S CODE ---
    // Prevent deletion of Super Admin accounts
    const userCheck = await pool.query("SELECT role FROM users WHERE id = $1", [id]);
    if (userCheck.rows[0]?.role === 'SUPER_ADMIN') {
        return res.status(403).json({ message: "System Protection: Super Admin cannot be deleted." });
    }
    // --- END OF MILAP'S CODE ---

    await pool.query(`UPDATE users SET is_active = FALSE WHERE id = $1`, [id]);
    await logService.createLog(
        req.user.id, 
        'DELETE_USER', 
        Number(id), 
        `User deactivated/soft-deleted from system`
    );
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ---> START OF UPDATED CODE (NEW FUNCTION)
// ==========================================
const getOrgMembers = async (req, res) => {
  try {
    // Simplified query: Fetch all active users whose role is exactly 'USER'
    const result = await pool.query(
      `SELECT id, full_name, email, role 
       FROM users 
       WHERE role = 'USER' AND is_active = TRUE 
       ORDER BY full_name ASC`
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  // req.user.id is securely provided by your existing auth.middleware.js
  try {
    const query = 'SELECT id, full_name, email, role, organization_id, is_verified FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error fetching profile." });
  }
};
// ==========================================
// ---> END OF UPDATED CODE
// ==========================================
module.exports = { getUsers, updateUserRole, deleteUser, getOrgMembers, getProfile };