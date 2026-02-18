const organizationService = require("../../services/organization/organizationService");

const fetchOrganizations = async (req, res) => {
  try {
    const orgs = await organizationService.getAllOrganizations();
    res.status(200).json(orgs);
  } catch (error) {
    console.error("DATABASE CRASHED:", error.message);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

const addOrganization = async (req, res) => {
  try {
    const { name, code, type } = req.body;
    const org = await organizationService.createOrganization({ name, code, type });
    res.status(201).json(org);
  } catch (error) {
    console.error("INSERT FAILED:", error.message);
    res.status(500).json({ message: error.message });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrg = await organizationService.updateOrganization(id, req.body);
    res.status(200).json(updatedOrg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    await organizationService.deleteOrganization(id);
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