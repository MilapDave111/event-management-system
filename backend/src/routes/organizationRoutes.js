const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization/organizationController");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const ROLES = require("../utils/roles");

// Only Super Admin can manage organizations
router.post("/", authenticate, authorize([ROLES.SUPER_ADMIN]), organizationController.addOrganization);
router.get("/", authenticate, authorize([ROLES.SUPER_ADMIN]), organizationController.fetchOrganizations);
router.put("/:id", authenticate, authorize([ROLES.SUPER_ADMIN]), organizationController.updateOrganization);
router.delete("/:id", authenticate, authorize([ROLES.SUPER_ADMIN]), organizationController.deleteOrganization);

module.exports = router;