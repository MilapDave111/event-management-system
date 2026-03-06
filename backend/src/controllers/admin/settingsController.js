const pool = require("../../config/db");

// Manage Event Categories
exports.getCategories = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM event_categories ORDER BY name ASC");
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch categories", error: error.message });
    }
};

exports.addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO event_categories (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to add category", error: error.message });
    }
};

// Manage Global Commission
exports.getPlatformSettings = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM platform_settings");
        const settings = result.rows.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings", error: error.message });
    }
};

exports.updateSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        await pool.query(
            "INSERT INTO platform_settings (key, value) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP",
            [key, value]
        );
        res.status(200).json({ message: `Setting ${key} updated successfully` });
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};