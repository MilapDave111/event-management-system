const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const ROLES = require("../utils/roles");

router.get("/", authenticate, authorize([ROLES.SUPER_ADMIN]), userController.getUsers);
router.put("/update-role", authenticate, authorize([ROLES.SUPER_ADMIN]), userController.updateUserRole);
router.delete("/:id", authenticate, authorize([ROLES.SUPER_ADMIN]), userController.deleteUser);
router.get("/org-members", authenticate, authorize(["ORG_ADMIN"]), userController.getOrgMembers);
router.get('/profile', authenticate, userController.getProfile);
module.exports = router;