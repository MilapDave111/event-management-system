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

const getAllOrganizations = async () => {
  const result = await pool.query(
    `SELECT id, name, code, type, status 
     FROM organizations 
     WHERE status = 'active' 
     ORDER BY created_at DESC`
  );
  return result.rows;
};

const updateOrganization = async (id, { name, code, type }) => {
  const result = await pool.query(
    `UPDATE organizations 
     SET name = $1, code = $2, type = $3 
     WHERE id = $4 
     RETURNING id, name, code, type, status`,
    [name, code, type, id]
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