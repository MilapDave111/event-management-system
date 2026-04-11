const organizationService = require("../../services/organization/organizationService");
const logService = require("../../services/admin/logService");
const fetchOrganizations = async (req, res) => {
  try {
    // --- START OF MILAP'S CODE ---
    // Extracting search and type filters from the query parameters
    const { search, type } = req.query;
    
    // Passing these filters to the service to allow for refined results
    const orgs = await organizationService.getAllOrganizations(search, type);
    // --- END OF MILAP'S CODE ---

    res.status(200).json(orgs);
  } catch (error) {
    // Merged: Using your error logging style with Milap's cleaner message
    console.error("FETCH FAILED:", error.message);
    res.status(500).json({ message: "Database error: " + error.message });
  }
}
const addOrganization = async (req, res) => {
  try {
    const { name, code, type } = req.body;
    const org = await organizationService.createOrganization({ name, code, type });
    await logService.createLog(
      req.user.id, 
      'REGISTER_ORG', 
      Number(org.id), 
      `Registered institution: ${name} (${code})`
    );
    res.status(201).json(org);
  } catch (error) {
    console.error("INSERT FAILED:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    // Pass req.body which contains name, code, type, email, etc.
    const updatedOrg = await organizationService.updateOrganization(id, req.body);
    
    // FIX: Extract name and code from req.body for the log message
    const { name, code } = req.body;

    await logService.createLog(
      req.user.id, 
      'UPDATE_ORG', // Changed from REGISTER_ORG to UPDATE_ORG for accuracy
      Number(id), 
      `Updated institution: ${name} (${code})`
    );

    res.status(200).json(updatedOrg);
  } catch (error) {
    console.error("UPDATE ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    await organizationService.deleteOrganization(id);
    await logService.createLog(
      req.user.id, 
      'DELETE_ORG', 
      Number(id), 
      `Deleted institution ID: ${id}`
    );  
    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CRITICAL: Ensure all these match what the router calls
module.exports = {
  addOrganization,
  fetchOrganizations,
  updateOrganization,
  deleteOrganization
};