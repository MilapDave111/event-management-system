const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const ROLES = require("../utils/roles");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);

// Protected test route
router.get(
  "/me",
  authenticate,
  authorize([ROLES.USER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]),
  (req, res) => {
    res.status(200).json({
      message: "Access granted",
      user: req.user,
    });
  }
);

module.exports = router;
