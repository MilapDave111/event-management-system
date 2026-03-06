const pool = require("../../config/db");
const logService = require("../../services/admin/logService");


// const getActivityLogs = async (req, res) => {
//   try {
//     const { search, action } = req.query;
    
//     // Join with users table to show the Admin's name instead of just the ID
//     let query = `
//       SELECT al.*, u.full_name as admin_name 
//       FROM activity_logs al
//       LEFT JOIN users u ON al.admin_id = u.id 
//       WHERE 1=1`;
    
//     const params = [];

//     // Filter by details or admin name
//     if (search) {
//       params.push(`%${search}%`);
//       query += ` AND (al.details ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
//     }

//     // Filter by specific action type (e.g., UPDATE_USER_ROLE)
//     if (action) {
//       params.push(action);
//       query += ` AND al.action_type = $${params.length}`;
//     }

//     query += ` ORDER BY al.created_at DESC`;

//     const result = await pool.query(query, params);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// --- Dashboard Stats Logic ---
// Logic: Added to support the SuperAdmin.jsx dashboard we fixed earlier


// backend/src/controllers/admin/adminController.js
const getActivityLogs = async (req, res) => {
  try {
    const { search, action } = req.query;
    let query = `
      SELECT al.*, u.full_name as admin_name, u.role as admin_role, t.full_name as target_name 
      FROM activity_logs al
      LEFT JOIN users u ON al.admin_id = u.id 
      LEFT JOIN users t ON al.target_id = t.id
      WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (al.details ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR t.full_name ILIKE $${params.length})`;
    }
    if (action) {
      params.push(action);
      query += ` AND al.action_type = $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC`;
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getStats = async (req, res) => {
    try {
        const userCount = await pool.query("SELECT COUNT(*) FROM users");
        const eventCount = await pool.query("SELECT COUNT(*) FROM events");
        const orgCount = await pool.query("SELECT COUNT(*) FROM organizations");
        
        res.status(200).json({
            users: parseInt(userCount.rows[0].count),
            events: parseInt(eventCount.rows[0].count),
            organizations: parseInt(orgCount.rows[0].count)
        });
    } catch (error) {
        console.error("STATS ERROR:", error.message);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};

// --- Activity Logs Logic ---
// Logic: Fetches the paper trail of admin actions
const fetchLogs = async (req, res) => {
    try {
        const logs = await logService.getLogs();
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Category Logic ---
const addCategory = async (req, res) => {
    const { name } = req.body;
    const adminId = req.user.id; // From auth middleware

    if (!name) return res.status(400).json({ message: "Name is required" });
    
    try {
        const result = await pool.query(
            "INSERT INTO event_categories (name) VALUES ($1) RETURNING *",
            [name]
        );

        // Logic: Log the action so we know who added the category
      await logService.createLog(
            adminId, 
            'CREATE_CATEGORY', 
            Number(result.rows[0].id), 
            `Added category: ${name}`
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM event_categories ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Settings Logic ---
const getPlatformSettings = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM platform_settings");
        // Convert array to key-value object for easier frontend use
        const settings = result.rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSetting = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const adminId = req.user.id;

    try {
        await pool.query(
            "UPDATE platform_settings SET value = $1 WHERE key = $2", 
            [typeof value === 'object' ? JSON.stringify(value) : value, key]
        );

        // Logic: Logging the settings change
       await logService.createLog(
            adminId, 
            'UPDATE_SETTING', 
            null, 
            `Changed setting [${key}] to ${value}`
        );
        res.json({ message: "Updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
  getStats,
  fetchLogs,
  addCategory,
  getAllCategories,
  getPlatformSettings,
  updateSetting,
  getActivityLogs
  
};