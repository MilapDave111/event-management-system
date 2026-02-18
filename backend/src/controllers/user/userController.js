const pool = require("../../config/db");

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.organization_id, o.name as organization_name 
       FROM users u LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE u.is_active = TRUE ORDER BY u.created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  const { userId, role, organizationId } = req.body;
  try {
    await pool.query(`UPDATE users SET role = $1, organization_id = $2 WHERE id = $3`, [role, organizationId || null, userId]);
    res.status(200).json({ message: "User updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET is_active = FALSE WHERE id = $1`, [id]);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, updateUserRole, deleteUser };