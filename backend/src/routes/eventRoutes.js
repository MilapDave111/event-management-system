const express = require("express");
const router = express.Router();

// Controller Imports
const eventController = require("../controllers/event/eventController");
const regController = require("../controllers/event/registrationController");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const taskController = require("../controllers/event/taskController");
const managerStaffCtrl = require("../controllers/eventManager/staffController");
const feedbackController = require("../controllers/event/feedbackController");

// ==========================================
// 1. SUPER ADMIN ROUTES
// ==========================================
router.get("/moderation", authenticate, authorize(["SUPER_ADMIN"]), eventController.getAllEventsForModeration);
router.put("/moderate", authenticate, authorize(["SUPER_ADMIN"]), eventController.moderateEvent);
router.get("/admin/all", authenticate, authorize(["SUPER_ADMIN"]), eventController.getAdminAllEvents);

// ==========================================
// 2. ORG ADMIN ROUTES (Event Lifecycle)
// ==========================================
router.get("/org-stats", authenticate, authorize(["ORG_ADMIN"]), eventController.getOrgStats);
router.get("/trash", authenticate, authorize(["ORG_ADMIN"]), eventController.getTrashEvents);
router.post("/", authenticate, authorize(["ORG_ADMIN"]), eventController.createEvent);
router.put("/:id", authenticate, authorize(["ORG_ADMIN"]), eventController.updateEvent);
router.post("/assign-role", authenticate, authorize(["ORG_ADMIN"]), eventController.assignEventRole);
router.post("/lifecycle", authenticate, authorize(["ORG_ADMIN"]), eventController.handleEventLifecycle);

// --- Org Admin Payment Routes (Platform Fee) ---
router.post("/init-payment", authenticate, authorize(["ORG_ADMIN"]), eventController.initPayment);
router.post("/verify-payment", authenticate, authorize(["ORG_ADMIN"]), eventController.verifyPayment);

// ==========================================
// 3. USER / ATTENDEE ROUTES
// ==========================================
router.get("/approved", authenticate, eventController.getAllApprovedEvents); 
router.post("/register", authenticate, authorize(["USER"]), regController.registerForEvent);
router.get("/my-registrations", authenticate, authorize(["USER"]), regController.getMyRegistrations);
router.post("/:eventId/feedback", authenticate, feedbackController.submitFeedback);
router.post("/toggle-save", authenticate, authorize(["USER"]), eventController.toggleSave);
router.get("/my-saved", authenticate, authorize(["USER"]), eventController.getSavedEvents);
// --- Student Ticket Payment ---
router.post("/user/init-payment", authenticate, authorize(["USER"]), regController.initUserPayment);
router.post("/user/verify-payment", authenticate, authorize(["USER"]), regController.verifyUserPayment);

// ==========================================
// 4. EVENT MANAGER ROUTES (Operational)
// ==========================================
router.get("/manager-stats", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getManagerStats);
router.get("/managed-events", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getMyManagedEvents);
router.get("/:eventId/registrations", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), eventController.getEventRegistrations);
<<<<<<< HEAD

// FIX: Added /:eventId to the path so the router correctly captures the ID from the frontend
router.get("/:eventId/ai-summary", authenticate, authorize(["SUPER_ADMIN", "ORG_ADMIN", "EVENT_MANAGER"]), feedbackController.generateFeedbackSummary);
=======
router.get("/ai-summary", authenticate, authorize(["SUPER_ADMIN", "ORG_ADMIN", "EVENT_MANAGER"]), feedbackController.generateFeedbackSummary);
>>>>>>> 85b69858d036ab59462bd5a6dac002622ffe8a54

// --- Shared Access (Admin, Manager, Staff) ---
router.get("/my-events", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), eventController.getMyEvents);

// ==========================================
// 5. STAFF MANAGEMENT & SUB-TEAMS (staffController)
// ==========================================
router.get("/search-users", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.searchUsers);
router.get("/list-staff", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.getStaffLists);
router.post("/assign-staff", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.assignStaff);
router.post("/remove-staff/:id", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.removeStaff);

// --- Sub-Team CRUD (Now in staffController) ---
router.get("/event-team", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.getStaffList);
router.post("/sub-teams", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.createSubTeam);
router.get("/:eventId/sub-teams", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), managerStaffCtrl.getSubTeamsByEvent);
router.post("/sub-teams/assign", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.assignStaffToSubTeam); 
router.post("/sub-teams/remove-member", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.removeStaffFromSubTeam);
router.delete("/sub-teams/:subTeamId", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), managerStaffCtrl.deleteSubTeam);
<<<<<<< HEAD

=======
>>>>>>> 85b69858d036ab59462bd5a6dac002622ffe8a54
// ==========================================
// 6. TASKS & KANBAN (taskController)
// ==========================================
router.post("/tasks", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), taskController.createTask);
router.post("/assign-tasks-final", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER"]), taskController.assignTasksFinal);
router.get("/:eventId/tasks", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), taskController.getEventTasks);
router.put("/tasks/:taskId/status", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), taskController.updateTaskStatus);
router.get("/tasks", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), taskController.getAllTasks);
router.get("/tasks/logs", authenticate, authorize(["ORG_ADMIN", "EVENT_MANAGER", "EVENT_STAFF"]), taskController.getAuditLogs);
<<<<<<< HEAD

// ==========================================
// 7. EVENT STAFF SPECIFIC ROUTES
// ==========================================
=======
// ==========================================
// 7. EVENT STAFF SPECIFIC ROUTES
// ==========================================

>>>>>>> 85b69858d036ab59462bd5a6dac002622ffe8a54
router.get("/staff-stats", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffStats);
router.get("/assigned-events", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffAssignedEvents);
router.get("/staff/event-team", authenticate, authorize(["EVENT_STAFF"]), managerStaffCtrl.getStaffList);
router.get("/staff/:eventId/registrations", authenticate, authorize(["EVENT_STAFF"]), eventController.getEventRegistrations);
router.get("/staff/:eventId/attendees", authenticate, authorize(["EVENT_STAFF", "EVENT_MANAGER", "ORG_ADMIN"]), managerStaffCtrl.getEventAttendees);

// --- Field Operations ---
router.post("/staff/scan-ticket", authenticate, authorize(["EVENT_STAFF", "EVENT_MANAGER", "ORG_ADMIN"]), managerStaffCtrl.scanTicket);

// ==========================================
// 8. AI & UTILS
// ==========================================
router.post("/generate-poster", authenticate, eventController.generateGlobalAiPoster);

module.exports = router;