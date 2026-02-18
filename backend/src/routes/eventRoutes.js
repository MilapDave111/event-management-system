const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event/eventController");
const regController = require("../controllers/event/registrationController");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const ROLES = require("../utils/roles");

// Super Admin
router.get("/moderation", authenticate, authorize(["SUPER_ADMIN"]), eventController.getAllEventsForModeration);
router.put("/moderate", authenticate, authorize(["SUPER_ADMIN"]), eventController.moderateEvent);

// Org Admin
router.get("/org-stats", authenticate, authorize(["ORG_ADMIN"]), eventController.getOrgStats);
router.get("/my-events", authenticate, authorize(["ORG_ADMIN"]), eventController.getMyEvents);
router.post("/", authenticate, authorize(["ORG_ADMIN"]), eventController.createEvent);

// User/Student Discovery
router.get("/approved", authenticate, eventController.getAllApprovedEvents); 

// User/Student Registrations
router.post("/register", authenticate, authorize(["USER"]), regController.registerForEvent);
router.get("/my-registrations", authenticate, authorize(["USER"]), regController.getMyRegistrations);

module.exports = router;