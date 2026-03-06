const pool = require("../../config/db");

const createOrganization = async ({ name, code, type }) => {
  const result = await pool.query(
    `INSERT INTO organizations (name, code, type, status) 
     VALUES ($1, $2, $3, 'active') 
     RETURNING id, name, code, type, status`,
    [name, code, type]
  );
  return result.rows[0];
};

const getAllOrganizations = async (search, type) => {
  try {
    let query = "SELECT * FROM organizations WHERE status != 'deleted'";
    const params = [];

    // --- START OF MILAP'S CODE ---
    // If a search term is provided, filter by name
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    // If a type is selected (e.g., 'University', 'Corporate'), filter by type
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    // --- END OF MILAP'S CODE ---

    query += " ORDER BY name ASC";
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    throw new Error("Error fetching organizations: " + error.message);
  }
};
const updateOrganization = async (id, { name, code, type, email, phone, address, city, state, pincode, country }) => {
  const result = await pool.query(
    `UPDATE organizations 
     SET name = $1, code = $2, type = $3, email = $4, phone = $5, address = $6, city = $7, state = $8, pincode = $9, country = $10 
     WHERE id = $11 
     RETURNING *`,
    [name, code, type, email, phone, address, city, state, pincode, country, id]
  );
  return result.rows[0];
};

const deleteOrganization = async (id) => {
  // Logic: Soft delete by updating status to 'deleted'
  await pool.query(
    `UPDATE organizations SET status = 'deleted' WHERE id = $1`, 
    [id]
  );
  return { message: "Deleted successfully" };
};

module.exports = { 
  createOrganization, 
  getAllOrganizations, 
  updateOrganization, 
  deleteOrganization 
};