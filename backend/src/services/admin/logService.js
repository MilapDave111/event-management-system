const pool = require('../../config/db');

const createLog = async (adminId, actionType, targetId, details) => {
    try {
        await pool.query(
            'INSERT INTO activity_logs (admin_id, action_type, target_id, details) VALUES ($1, $2, $3, $4)',
            [adminId, actionType, targetId, details]
        );
    } catch (err) {
        console.error("LOGGING ERROR:", err.message);
        // We don't throw error here so the main action doesn't fail if logging fails
    }
};

// const getLogs = async () => {
//     const res = await pool.query(`
//         SELECT l.*, u.email as admin_email 
//         FROM activity_logs l 
//         JOIN users u ON l.admin_id = u.id 
//         ORDER BY l.created_at DESC LIMIT 100
//     `);
//     return res.rows;
// };
// backend/src/services/admin/logService.js
const getLogs = async () => {
    const res = await pool.query(`
        SELECT 
            l.*, 
            u.full_name as admin_name, 
            u.role as admin_role,
            t.full_name as target_name
        FROM activity_logs l 
        JOIN users u ON l.admin_id = u.id 
        LEFT JOIN users t ON l.target_id = t.id
        ORDER BY l.created_at DESC 
        LIMIT 100
    `);
    return res.rows;
};
module.exports = { createLog, getLogs };