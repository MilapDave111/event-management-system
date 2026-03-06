const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event/eventController");
const regController = require("../controllers/event/registrationController");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const taskController = require("../controllers/event/taskController");
const managerStaffCtrl = require("../controllers/eventManager/staffController");

// --- Super Admin Routes ---
router.get("/moderation", authenticate, authorize(["SUPER_ADMIN"]), eventController.getAllEventsForModeration);
router.put("/moderate", authenticate, authorize(["SUPER_ADMIN"]), eventController.moderateEvent);
router.get("/admin/all", authenticate, authorize(["SUPER_ADMIN"]), eventController.getAdminAllEvents);

// --- Org Admin Routes ---
router.get("/org-stats", authenticate, authorize(["ORG_ADMIN"]), eventController.getOrgStats);
router.get(
  "/my-events", 
  authenticate, 
  authorize(["ORG_ADMIN", "EVENT_MANAGER","EVENT_STAFF"]), 
  eventController.getMyEvents
);
router.get("/trash", authenticate, authorize(["ORG_ADMIN"]), eventController.getTrashEvents);
router.post("/", authenticate, authorize(["ORG_ADMIN"]), eventController.createEvent);
router.put("/:id", authenticate, authorize(["ORG_ADMIN"]), eventController.updateEvent);
router.post("/assign-role", authenticate, authorize(["ORG_ADMIN"]), eventController.assignEventRole);

// --- User/Student Discovery & Registration ---
router.get("/approved", authenticate, eventController.getAllApprovedEvents); 
router.post("/lifecycle", authenticate, authorize(["ORG_ADMIN"]), eventController.handleEventLifecycle);
router.post("/register", authenticate, authorize(["USER"]), regController.registerForEvent);
router.get("/my-registrations", authenticate, authorize(["USER"]), regController.getMyRegistrations);

// --- Event Manager & Staff Routes (Functional Tabs) ---
// 1. Dashboard Stats
router.get("/manager-stats", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getManagerStats);

// 2. Tab: My Managed Events
router.get("/managed-events", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getMyManagedEvents);

// 3. Tab: View Registrations
router.get("/:eventId/registrations", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getEventRegistrations);

// 4. Tab: Assign Staff (Logic & Dropdowns)
router.get("/search-users", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.searchUsers);
router.get("/list-staff", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.getStaffLists); // Fixed to use plural function
router.post("/assign-staff", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.assignStaff);

// 5. Tab: View Team (Currently Assigned)
router.get("/event-team", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.getStaffList);
router.post("/remove-staff/:id", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.removeStaff);

// --- Tasks / Kanban ---
router.post("/tasks", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), taskController.createTask);
router.post("/assign-tasks-final", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), taskController.assignTasksFinal);
router.get("/:eventId/tasks", authenticate, taskController.getEventTasks);
router.patch("/tasks/:taskId/status", authenticate, taskController.updateTaskStatus);

/// Staff Specific Dashboard Stats
  router.get("/staff-stats", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffStats);

// Staff My Assignments Data
router.get("/assigned-events", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffAssignedEvents);

// Staff Team Details (Read-only)
router.get("/staff/event-team", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffList);
// 3. View Registrations (Read-only for staff)
router.get("/staff/:eventId/registrations", authenticate, authorize(["EVENT_STAFF"]), eventController.getEventRegistrations);
module.exports = router;