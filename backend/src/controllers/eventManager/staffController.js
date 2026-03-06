const pool = require("../../config/db");

// 1. Search for people where role is 'USER'
const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const orgId = req.user.organization_id; // Get the manager's org ID

    const result = await pool.query(
      `SELECT id, full_name, email 
       FROM users 
       WHERE role = 'USER' 
         AND organization_id = $1 
         AND full_name ILIKE $2 
       LIMIT 5`,
      [orgId, `%${search}%`] // Filter by Org ID and Name
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// 2. Change their role to 'EVENT_STAFF'
// 2. ASSIGN STAFF: Fixed to actually save them to the event team!
// const assignStaff = async (req, res) => {
//   try {
//     const { userId, eventId } = req.body; // Getting both ID's from React
//     const managerId = req.user.id; // The logged-in manager

//     // First, ensure their role is staff
//     await pool.query("UPDATE users SET role = 'EVENT_STAFF' WHERE id = $1", [userId]);

//     // Second, ACTUALLY assign them to the event_team table!
//     await pool.query(
//       "INSERT INTO event_team (user_id, event_id, managed_by) VALUES ($1, $2, $3)",
//       [userId, eventId, managerId]
//     );

//     res.status(200).json({ success: true, message: "Staff successfully assigned to event!" });
//   } catch (err) {
//     console.error("Assign Staff Error:", err);
//     res.status(500).json({ success: false, message: "Error assigning user to event team" });
//   }
// };

const assignStaff = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const managerId = req.user.id;

    // 1. Ensure their role is staff
    await pool.query("UPDATE users SET role = 'EVENT_STAFF' WHERE id = $1", [userId]);

    // 2. Insert with conflict handling to prevent 500 errors
    await pool.query(
      `INSERT INTO event_team (user_id, event_id, managed_by) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [userId, eventId, managerId]
    );

    res.status(200).json({ success: true, message: "Staff successfully assigned to event!" });
  } catch (err) {
    console.error("Assign Staff Error:", err);
    res.status(500).json({ success: false, message: "Error assigning user to event team" });
  }
};


// 3. Get everyone who is currently 'EVENT_STAFF'
const getStaffList = async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    const result = await pool.query(
      `SELECT 
        et.team_id,
        u.full_name AS staff_name, 
        u.email AS staff_email,
        m.full_name AS manager_name,
        e.title AS event_title
       FROM event_team et
       JOIN users u ON et.user_id = u.id
       JOIN users m ON et.managed_by = m.id
       JOIN events e ON et.event_id = e.id
       WHERE u.organization_id = $1 
       ORDER BY et.team_id DESC`,
      [orgId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// In your backend staffController.js
const getStaffLists = async (req, res) => {
  try {
    const orgId = req.user.organization_id; 
    const result = await pool.query(
      `SELECT id, full_name, email FROM users 
       WHERE role = 'EVENT_STAFF' AND organization_id = $1`, // Only active staff
      [orgId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching staff list" });
  }
};

// 4. Change their role back to 'USER'
const removeStaff = async (req, res) => {
  try {
    const { id } = req.params; // This is the user_id

    // 1. DELETE from event_team table first
    // This ensures they disappear from the 'View Team' tab
    await pool.query("DELETE FROM event_team WHERE user_id = $1", [id]);

    // 2. UPDATE user role back to 'USER'
    // This ensures they disappear from the 'Assign Staff' dropdown
    await pool.query("UPDATE users SET role = 'USER' WHERE id = $1", [id]);
await logService.createLog(req.user.id, 'REMOVE_STAFF', Number(id), `Removed staff member and reverted to USER role`);
    res.status(200).json({ 
      success: true, 
      message: "Staff member fully reverted to User and removed from all teams." 
    });
  } catch (err) {
    console.error("Remove Staff Error:", err.message);
    res.status(500).json({ success: false, message: "Server error during removal" });
  }
};
// Add to backend/src/controllers/eventManager/staffController.js

const getStaffAssignedEvents = async (req, res) => {
  try {
    const staffId = req.user.id;
    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM events e
       JOIN event_team et ON e.id = et.event_id
       JOIN organizations o ON e.org_id = o.id
       WHERE et.user_id = $1 AND e.deleted_at IS NULL
       ORDER BY e.event_date ASC`,
      [staffId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add to module.exports
module.exports = {
  // ... existing exports
  getStaffAssignedEvents
};
// 5. Keep Stats for the Dashboard
const getStaffStats = async (req, res) => {
  try {
    res.status(200).json({
      assigned_tasks: 0,
      completed_tasks: 0,
      attendance_scans: 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



//added by sakshi
const getMyManagedEvents = async (req, res) => {
  try {
    const managerId = req.user.id; // The ID of the logged-in Event Manager

    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM events e
       JOIN organizations o ON e.org_id = o.id
       WHERE e.event_manager_id = $1 
         AND e.deleted_at IS NULL
       ORDER BY e.event_date ASC`,
      [managerId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// EXPORT ALL FUNCTIONS HERE
module.exports = {
  searchUsers,
  assignStaff,
  getStaffList,
  getStaffLists,
  removeStaff,
  getStaffStats,
  getMyManagedEvents, 
  getStaffAssignedEvents
};