const pool = require("../../config/db");

// Function to create a new task (This was missing)
const createTask = async (req, res) => {
  try {
    const { title, description, status, event_id, assigned_to } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (title, description, status, event_id, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, status || 'todo', event_id, assigned_to]
    );
    await logService.createLog(req.user.id, 'CREATE_TASK', Number(event_id), `Created task: ${title}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEventTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query("SELECT * FROM tasks WHERE event_id = $1", [eventId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE tasks SET status = $1 WHERE id = $2", [status, taskId]);
    await logService.createLog(req.user.id, 'UPDATE_TASK', Number(taskId), `Task status updated to ${status}`);
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ---> ADD THIS MISSING FUNCTION <---
const assignTasksFinal = async (req, res) => {
  try {
    const { event_type, team_title, members, start_date, due_date } = req.body;
    
    // We will use pool directly here to execute her model's query
    const query = `
      INSERT INTO tasks (event_type, team_title, members, start_date, due_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [
      event_type, 
      team_title, 
      JSON.stringify(members), 
      start_date, 
      due_date, 
      req.user.id
    ]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


module.exports = {
  createTask,
  getEventTasks,
  updateTaskStatus,
  assignTasksFinal
};