const pool = require("../../config/db");
const eventService = require("../../services/event/event.service");


// 1. Super Admin: Moderation Queue
const getAllEventsForModeration = async (req, res) => {
  try {
    const events = await eventService.getModerationQueue(req.user);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Super Admin: Moderate (Approve/Reject)
const moderateEvent = async (req, res) => {
  try {
    const event = await eventService.moderateEvent(req.user, req.body);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 3. Org Admin: Dashboard Stats
const getOrgStats = async (req, res) => {
  try {
    const org_id = req.user.organization_id;
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_events,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_events
       FROM events WHERE org_id = $1`,
      [org_id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Org Admin: My Events List
const getMyEvents = async (req, res) => {
  try {
    const events = await eventService.getMyEvents(req.user);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Org Admin: Create Event
const createEvent = async (req, res) => {
  try {
    const event = await eventService.createEvent(req.user, req.body);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. User: Get Approved Events for Discovery
const getAllApprovedEvents = async (req, res) => {
  try {
    const events = await eventService.getApprovedEvents();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleEventLifecycle = async (req, res) => {
  try {
    const { action, eventId } = req.body;
    const result = await eventService.handleLifecycle(req.user, action, eventId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params; // Extracts the "11" from /api/events/11
    const event = await eventService.updateEvent(req.user, id, req.body);
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAllEventsForModeration, 
  moderateEvent, 
  getOrgStats, 
  getMyEvents, 
  createEvent,
  getAllApprovedEvents ,
  handleEventLifecycle,
  updateEvent
};