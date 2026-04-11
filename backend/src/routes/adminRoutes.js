const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Verified path
const orgController = require("../controllers/organization/organizationController"); // <--- ADD THIS LINE
// FIX: Path corrected to go up one level to 'src', then into 'middleware'
// Ensure your file is named exactly 'authMiddleware.js' (no dots in between)
const { authenticate, authorize } = require("../middleware/auth.middleware");

// Ensure this path is correct based on your folder structure
const adminController = require("../controllers/admin/adminController");

// --- CATEGORIES ---
router.post(
  "/categories",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  adminController.addCategory
);

router.get(
  "/categories",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  adminController.getAllCategories
);

// --- SETTINGS ---
router.get(
  "/settings",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  adminController.getPlatformSettings
);

router.put(
  "/settings/:key",
  authenticate,
  authorize(["SUPER_ADMIN"]),
  adminController.updateSetting
);
router.get("/organizations", orgController.fetchOrganizations);
router.get("/stats", authenticate, authorize(["SUPER_ADMIN"]), adminController.getStats);
router.get("/logs", authenticate, authorize(["SUPER_ADMIN"]), adminController.fetchLogs);
// Ensure the path matches the frontend request exactly
router.get("/admin/logs", authenticate, authorize(["SUPER_ADMIN"]), adminController.getActivityLogs);
module.exports = router;