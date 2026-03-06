const pool = require("../../config/db");

const TaskModel = {
  // Logic for Team Assignment Portal
  createTask: async (data) => {
    const { event_type, team_title, members, start_date, due_date, attachment_url, created_by } = data;
    
    const query = `
      INSERT INTO tasks (event_type, team_title, members, start_date, due_date, attachment_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [
      event_type, 
      team_title, 
      JSON.stringify(members), // Saving Member 1 & 2 roles as JSON
      start_date, 
      due_date, 
      attachment_url || null, 
      created_by
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Logic for Kanban
  getTasksByEvent: async (eventType) => {
    const query = `SELECT * FROM tasks WHERE event_type = $1 ORDER BY created_at DESC;`;
    const result = await pool.query(query, [eventType]);
    return result.rows;
  },

  updateStatus: async (taskId, status) => {
    const query = `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
    const result = await pool.query(query, [status, taskId]);
    return result.rows[0];
  }
};

module.exports = TaskModel;