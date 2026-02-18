const pool = require("../../config/db");

// 1. Super Admin: Moderation Queue
const getAllEventsForModeration = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM events e 
       LEFT JOIN organizations o ON e.org_id = o.id 
       ORDER BY e.created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Super Admin: Moderate (Approve/Reject)
const moderateEvent = async (req, res) => {
  const { eventId, status, rejection_reason } = req.body;
  try {
    const result = await pool.query(
      `UPDATE events SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *`,
      [status, rejection_reason || null, eventId]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Org Admin: Dashboard Stats
const getOrgStats = async (req, res) => {
  try {
    const org_id = req.user.organization_id;
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_events,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_events
       FROM events WHERE org_id = $1`,
      [org_id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Org Admin: My Events List
const getMyEvents = async (req, res) => {
  try {
    const org_id = req.user.organization_id;
    const result = await pool.query(`SELECT * FROM events WHERE org_id = $1`, [org_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Org Admin: Create Event
const createEvent = async (req, res) => {
  const { title, description, event_date, location } = req.body;
  const org_id = req.user.organization_id;
  try {
    const result = await pool.query(
      `INSERT INTO events (org_id, title, description, event_date, location, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [org_id, title, description, event_date, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. User: Get Approved Events for Discovery
const getAllApprovedEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM events e 
       JOIN organizations o ON e.org_id = o.id 
       WHERE e.status = 'approved' 
       ORDER BY e.event_date ASC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAllEventsForModeration, 
  moderateEvent, 
  getOrgStats, 
  getMyEvents, 
  createEvent,
  getAllApprovedEvents // MUST BE HERE
};