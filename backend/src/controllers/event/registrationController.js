const pool = require("../../config/db");

const registerForEvent = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  try {
    // Check if event is approved first
    const eventCheck = await pool.query("SELECT status FROM events WHERE id = $1", [eventId]);
    if (eventCheck.rows[0]?.status !== 'approved') {
      return res.status(400).json({ message: "You can only register for approved events." });
    }

    await pool.query(
      "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );
    res.status(201).json({ message: "Successfully registered!" });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: "Already registered." });
    res.status(500).json({ message: error.message });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN organizations o ON e.org_id = o.id
       WHERE r.user_id = $1`,
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerForEvent, getMyRegistrations };