const express = require('express');
const router = express.Router();
const taskController = require('../controllers/event/taskController');
const { authenticate } = require('../middleware/auth.middleware'); 

// Create a new task
router.post('/', authenticate, taskController.createTask);

// Get all tasks 
router.get('/', authenticate, taskController.getAllTasks);

// Get tasks for a specific event
router.get('/event/:eventId', authenticate, taskController.getEventTasks);

// Update a task's status (Drag & Drop, Approve, Reject)
router.put('/:taskId/status', authenticate, taskController.updateTaskStatus);

// Assign tasks final function
router.post('/assign-final', authenticate, taskController.assignTasksFinal);

// Fetch Audit Logs from auditslogskanban table
router.get('/logs', authenticate, taskController.getAuditLogs);

module.exports = router;