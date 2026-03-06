const pool = require("../../config/db");
const logService = require("../../services/admin/logService");
const eventService = require("../../services/event/event.service");

const registerForEvent = async (req, res) => {
  try {
    const result = await eventService.registerForEvent(
      req.user,
      req.body.eventId
    );
await logService.createLog(req.user.id, 'REGISTER_FOR_EVENT', Number(req.body.eventId), `User registered for event`);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes("approved")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await eventService.getMyRegistrations(req.user);
    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = { registerForEvent, getMyRegistrations };