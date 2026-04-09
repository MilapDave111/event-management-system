const pool = require("../../config/db");
const logService = require("../../services/admin/logService"); // Required for removeStaff log

const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const orgId = req.user.organization_id; 

    const result = await pool.query(
      `SELECT id, full_name, email 
       FROM users 
       WHERE role = 'USER' 
         AND organization_id = $1 
         AND full_name ILIKE $2 
       LIMIT 5`,
      [orgId, `%${search}%`] 
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignStaff = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const managerId = req.user.id;

    await pool.query("UPDATE users SET role = 'EVENT_STAFF' WHERE id = $1", [userId]);
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

const getStaffList = async (req, res) => {
  try {
    const orgId = req.user.organization_id || req.user.org_id;
    const result = await pool.query(
      `SELECT 
        et.team_id,
        e.id AS event_id,
        e.title AS event_title,
        u.id AS user_id,       -- <--- ALIAS THIS AS user_id
        u.full_name AS staff_name, 
        u.email AS staff_email,
        COALESCE(m.full_name, 'Manager') AS manager_name
       FROM event_team et
       JOIN users u ON et.user_id = u.id
       JOIN events e ON et.event_id = e.id
       LEFT JOIN users m ON e.event_manager_id = m.id
       WHERE e.org_id = $1`,
      [orgId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Sync Error" });
  }
};

const getStaffLists = async (req, res) => {
  try {
    const orgId = req.user.organization_id; 
    const result = await pool.query(
      `SELECT id, full_name, email FROM users 
       WHERE role = 'EVENT_STAFF' AND organization_id = $1`,
      [orgId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching staff list" });
  }
};

const removeStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM event_team WHERE user_id = $1", [id]);
    await pool.query("UPDATE users SET role = 'USER' WHERE id = $1", [id]);
    await logService.createLog(req.user.id, 'REMOVE_STAFF', Number(id), `Removed staff member and reverted to USER role`);
    
    res.status(200).json({ success: true, message: "Staff member fully reverted to User and removed from all teams." });
  } catch (err) {
    console.error("Remove Staff Error:", err.message);
    res.status(500).json({ success: false, message: "Server error during removal" });
  }
};

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

const getMyManagedEvents = async (req, res) => {
  try {
    const managerId = req.user.id; 
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

const scanTicket = async (req, res) => {
  try {
    const { qr_token } = req.body;
    const staffId = req.user.id;

    if (!qr_token) return res.status(400).json({ success: false, message: "QR Token is required" });

    const regResult = await pool.query(
      `SELECT r.id, r.event_id, r.attendance, u.full_name 
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.qr_token = $1`,
      [qr_token]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invalid Ticket. No matching registration found." });
    }

    const registration = regResult.rows[0];

    const staffCheck = await pool.query(
      `SELECT 1 FROM event_team WHERE user_id = $1 AND event_id = $2`,
      [staffId, registration.event_id]
    );

    if (staffCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not assigned as staff for this event." });
    }

    if (registration.attendance) {
      return res.status(400).json({ success: false, message: `Ticket already scanned for ${registration.full_name}. Duplicate entry denied.` });
    }

    await pool.query(`UPDATE registrations SET attendance = TRUE WHERE id = $1`, [registration.id]);

    res.status(200).json({ success: true, message: `Attendance marked present for ${registration.full_name}` });
  } catch (err) {
    console.error("Scan Error:", err);
    res.status(500).json({ success: false, message: "Server error during scanning." });
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1 AND r.attendance = TRUE`,
      [eventId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Fetch Attendees Error:", err);
    res.status(500).json({ success: false, message: "Database error fetching attendees." });
  }
};



/**
 * 1. Create a Sub-Team (Operational Unit)
 */
const createSubTeam = async (req, res) => {
  try {
    const { event_id, team_name, description } = req.body;
    const managerId = req.user.id; // From your auth middleware

    if (!event_id || !team_name) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const query = `
      INSERT INTO sub_teams (event_id, team_name, description, created_by) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const result = await pool.query(query, [event_id, team_name, description, managerId]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("New Table Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubTeamsByEvent = async (req, res) => {
  try {
    const query = `
      SELECT 
        st.id, 
        st.team_name, 
        st.description, 
        COUNT(stm.user_id) AS member_count,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', u.id,
              'full_name', u.full_name,
              'email', u.email
            )
          ) FILTER (WHERE u.id IS NOT NULL), '[]'
        ) AS members
      FROM sub_teams st
      LEFT JOIN sub_team_members stm ON st.id = stm.sub_team_id
      LEFT JOIN users u ON stm.user_id = u.id
      WHERE st.event_id = $1
      GROUP BY st.id
      ORDER BY st.created_at DESC;
    `;
    const result = await pool.query(query, [req.params.eventId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Fetch Subteams Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch sub teams" });
  }
};
/**
 * 3. Assign a Staff Member to a Sub-Team
 */
const assignStaffToSubTeam = async (req, res) => {
  try {
    const { sub_team_id, user_id } = req.body;

    // 1. Validation
    if (!sub_team_id || !user_id) {
      return res.status(400).json({ success: false, message: "Missing Sub-Team ID or User ID" });
    }

    console.log(`[DEBUG] Attempting to assign User ${user_id} to Sub-Team ${sub_team_id}`);

    // 2. The Insert Query
    // ON CONFLICT prevents crashing if you try to assign the same person twice
    const query = `
      INSERT INTO sub_team_members (sub_team_id, user_id) 
      VALUES ($1, $2) 
      ON CONFLICT (sub_team_id, user_id) DO NOTHING
      RETURNING *;
    `;
    
    const result = await pool.query(query, [sub_team_id, user_id]);

    res.status(200).json({ 
      success: true, 
      message: "Staff assigned to sub-team successfully!",
      data: result.rows[0] 
    });
  } catch (error) {
    // 3. Detailed Error Logging
    console.error("Assign Sub-Team Error:", error.message);
    
    // If you get a Foreign Key error, this message will tell us which ID is wrong
    res.status(500).json({ 
      success: false, 
      message: "Database error: " + error.message 
    });
  }
};

/**
 * 4. Remove a Staff Member from a Sub-Team
 */
const removeStaffFromSubTeam = async (req, res) => {
  try {
    const { sub_team_id, user_id } = req.body;
    if (!sub_team_id || !user_id) return res.status(400).json({ success: false, message: "Missing required fields" });

    const query = `DELETE FROM sub_team_members WHERE sub_team_id = $1 AND user_id = $2;`;
    await pool.query(query, [sub_team_id, user_id]);
    res.status(200).json({ success: true, message: "Staff removed from sub-team." });
  } catch (error) {
    console.error("Remove Sub Team Member Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to remove staff from sub team" });
  }
};

/**
 * 5. Delete an Entire Sub-Team
 */
const deleteSubTeam = async (req, res) => {
  try {
    const { subTeamId } = req.params;
    
    // We use a query that handles everything
    const result = await pool.query(`DELETE FROM sub_teams WHERE id = $1 RETURNING *`, [subTeamId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Sub-team not found" });
    }

    res.status(200).json({ success: true, message: "Sub Team deleted successfully" });
  } catch (error) {
    console.error("Delete Sub Team Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete sub team" });
  }
};


// CLEAN EXPORT OF ALL FUNCTIONS
module.exports = {
  searchUsers,
  assignStaff,
  getStaffList,
  getStaffLists,
  removeStaff,
  getStaffStats,
  getMyManagedEvents, 
  getStaffAssignedEvents,
  scanTicket,
  getEventAttendees,
  createSubTeam, getSubTeamsByEvent,
  assignStaffToSubTeam, removeStaffFromSubTeam, deleteSubTeam
};