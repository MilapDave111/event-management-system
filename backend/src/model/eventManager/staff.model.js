const pool = require("../../config/db");

const StaffModel = {
  addMember: async (userId, managedBy) => {
    const query = `
      INSERT INTO event_team (user_id, managed_by) 
      VALUES ($1, $2) 
      ON CONFLICT (user_id, managed_by) DO NOTHING
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, managedBy]);
    return result.rows[0];
  },

  getMembersByManager: async (managedBy) => {
    const query = `
      SELECT u.id, u.full_name, u.email 
      FROM users u
      JOIN event_team et ON u.id = et.user_id
      WHERE et.managed_by = $1;
    `;
    const result = await pool.query(query, [managedBy]);
    return result.rows;
  },

  removeMember: async (userId, managedBy) => {
    await pool.query(
      "DELETE FROM event_team WHERE user_id = $1 AND managed_by = $2", 
      [userId, managedBy]
    );
    return true;
  }
};

module.exports = StaffModel;