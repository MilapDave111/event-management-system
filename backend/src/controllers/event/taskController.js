const pool = require("../../config/db");

// 1. CREATE TASK
const createTask = async (req, res) => {
  try {
    const { 
      title, description, status, event_id, assigned_to, 
      priority, sub_team_id, start_date, due_date, subTasks, attachment_url 
    } = req.body;

    const sDate = start_date ? start_date : null;
    const eDate = due_date ? due_date : null;
    const managerId = req.user ? req.user.id : null;

    const result = await pool.query(
      `INSERT INTO tasks 
        (title, description, status, event_id, assigned_to, priority, sub_team_id, start_date, due_date, created_by, attachment_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [title, description, status || 'todo', event_id, assigned_to || null, priority || 'Medium', sub_team_id || null, sDate, eDate, managerId, attachment_url || null]
    );
    
    const newTask = result.rows[0];

    // Handle Subtasks
    if (subTasks && subTasks.length > 0) {
      const subtaskQuery = `INSERT INTO subtasks (task_id, title) VALUES ($1, $2)`;
      for (let i = 0; i < subTasks.length; i++) {
        await pool.query(subtaskQuery, [newTask.id, subTasks[i].title]);
      }
    }

    // Audit Log
    if (managerId) {
      const userRes = await pool.query(`SELECT full_name, role FROM users WHERE id = $1`, [managerId]);
      const userName = userRes.rows[0]?.full_name || 'Manager';
      const userRole = userRes.rows[0]?.role || 'MANAGER';
      // Inside createTask, replace the logMessage logic:
const logMessage = `${userName} (${userRole}) created and assigned a new task: "${title || 'Untitled Task'}"`;
      await pool.query(
        `INSERT INTO auditslogskanban (user_id, action, details) VALUES ($1, $2, $3)`,
        [managerId, 'CREATE_TASK', logMessage]
      );
    }

    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    console.error("Task Creation Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. GET EVENT TASKS
// backend/src/controllers/event/taskController.js

const getEventTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(`
      SELECT t.*, 
             u.full_name as assigned_name,
             m.full_name as assigned_by_name,
             st.team_name as sub_team_name,
             (
                SELECT json_agg(json_build_object(
                  'id', sbt.id, 
                  'title', sbt.title, 
                  'completed', sbt.is_completed -- Updated to match your DB column
                ))
                FROM subtasks sbt WHERE sbt.task_id = t.id
             ) as subtasks
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      LEFT JOIN users m ON t.created_by = m.id
      LEFT JOIN sub_teams st ON t.sub_team_id = st.id
      WHERE t.event_id = $1 
      ORDER BY t.created_at DESC
    `, [eventId]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. GET ALL TASKS
const getAllTasks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             u.full_name as assigned_name,
             m.full_name as assigned_by_name,
             (
                SELECT json_agg(json_build_object(
                  'id', sbt.id, 
                  'title', sbt.title, 
                  'completed', sbt.is_completed -- Updated to match your DB column
                ))
                FROM subtasks sbt WHERE sbt.task_id = t.id
             ) as subtasks
      FROM tasks t 
      LEFT JOIN users u ON t.assigned_to = u.id 
      LEFT JOIN users m ON t.created_by = m.id
      ORDER BY t.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. UPDATE TASK STATUS
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, rejection_reason, proof_url } = req.body; 
    const userId = req.user ? req.user.id : null; 

    const result = await pool.query(
      "UPDATE tasks SET status = $1, rejection_reason = COALESCE($2, rejection_reason), proof_url = COALESCE($3, proof_url) WHERE id = $4 RETURNING *", 
      [status, rejection_reason || null, proof_url || null, taskId]
    );
    const updatedTask = result.rows[0];

    // Audit Log
    if (userId) {
      const userRes = await pool.query(`SELECT full_name, role FROM users WHERE id = $1`, [userId]);
      const userName = userRes.rows[0]?.full_name || 'Unknown User';
      const userRole = userRes.rows[0]?.role || 'Staff';

      let logMessage = '';
      if (status === 'approved') {
        logMessage = `✅ ${userName} (${userRole}) APPROVED task "${updatedTask.title}".`;
      } else if (status === 'todo' && rejection_reason) {
        logMessage = `❌ ${userName} (${userRole}) REJECTED task "${updatedTask.title}" and sent it back to TO DO. Reason: "${rejection_reason}"`;
      } else {
        logMessage = `🔄 ${userName} (${userRole}) moved task "${updatedTask.title}" to ${status.toUpperCase()}.`;
        if (proof_url) logMessage += ' (Staff uploaded completion proof)';
      }

      await pool.query(
        `INSERT INTO auditslogskanban (user_id, action, details) VALUES ($1, $2, $3)`,
        [userId, 'UPDATE_TASK', logMessage]
      );
    }

    res.json({ success: true, message: "Status updated", data: updatedTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. ASSIGN TASKS FINAL
const assignTasksFinal = async (req, res) => {
  try {
    const { event_type, team_title, members, start_date, due_date } = req.body;
    const managerId = req.user ? req.user.id : null;
    
    const query = `
      INSERT INTO tasks (event_type, team_title, members, start_date, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [event_type, team_title, JSON.stringify(members), start_date, due_date, managerId]);

    if (managerId) {
      const userRes = await pool.query(`SELECT full_name, role FROM users WHERE id = $1`, [managerId]);
      const userName = userRes.rows[0]?.full_name || 'Manager';
      const userRole = userRes.rows[0]?.role || 'MANAGER';
      const logMessage = `${userName} (${userRole}) assigned team "${team_title}" to event type "${event_type}"`;

      await pool.query(
        `INSERT INTO auditslogskanban (user_id, action, details) VALUES ($1, $2, $3)`,
        [managerId, 'ASSIGN_TEAM', logMessage]
      );
    }
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. GET ALL AUDIT LOGS
const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.full_name as user_name 
      FROM auditslogskanban a 
      LEFT JOIN users u ON a.user_id = u.id 
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTask,
  getEventTasks,
  getAllTasks, 
  updateTaskStatus,
  assignTasksFinal,
  getAuditLogs
};