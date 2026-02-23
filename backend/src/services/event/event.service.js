const eventModel = require("../../model/event/event.model");


/**
 * Create Event (ORG_ADMIN)
 */
const createEvent = async (user, body) => {
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.role !== "ORG_ADMIN") {
    throw new Error("Only ORG_ADMIN can create events");
  }

  const {
    title,
    description,
    event_date,
    location,
    capacity,
    start_datetime,
    end_datetime,
    event_type,
    event_subtype,
    scope,
    poster_url
  } = body;

  if (!title || !event_date) {
    throw new Error("Title and event_date are required");
  }

  // Auto derive datetime if not provided
  const derivedStart = start_datetime
    ? start_datetime
    : `${event_date} 00:00:00`;

  const derivedEnd = end_datetime
    ? end_datetime
    : `${event_date} 23:59:59`;

  if (new Date(derivedEnd) < new Date(derivedStart)) {
    throw new Error("End datetime must be after start datetime");
  }

  if (capacity && capacity <= 0) {
    throw new Error("Capacity must be greater than 0");
  }

  return await eventModel.insertEvent({
    org_id: user.organization_id,
    title,
    description,
    event_date,
    location,
    capacity,
    start_datetime: derivedStart,
    end_datetime: derivedEnd,
    status: "pending",
    event_type,
    event_subtype,
    scope,
    poster_url
  });
};


/**
 * Get Events for ORG_ADMIN
 */
const getMyEvents = async (user) => {
    if (!user || user.role !== "ORG_ADMIN") {
        throw new Error("Unauthorized");
    }

    return await eventModel.getEventsByOrg(user.organization_id);
};
/**
 * Get Moderation Queue (SUPER_ADMIN)
 */
const getModerationQueue = async (user) => {
    if (!user || user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    return await eventModel.getAllEventsWithOrg();
};

/**
 * Moderate Event (Approve / Reject)
 */
const moderateEvent = async (user, body) => {
    if (!user || user.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    const { eventId, status, rejection_reason } = body;

    if (!eventId || !status) {
        throw new Error("Event ID and status are required");
    }

    return await eventModel.updateEventStatus(
        eventId,
        status,
        rejection_reason
    );
};
/**
 * Get Approved Events (Public/User)
 */
const getApprovedEvents = async () => {
    return await eventModel.getApprovedEvents();
};
/**
 * Register for Event
 */
const registerForEvent = async (user, eventId) => {
    if (!user) throw new Error("Unauthorized");

    const event = await eventModel.getEventStatus(eventId);

    if (!event) throw new Error("Event not found");

    if (event.status !== "approved") {
        throw new Error("You can only register for approved events.");
    }

    return await eventModel.registerUser(user.id, eventId);
};

/**
 * Get My Registrations
 */
const getMyRegistrations = async (user) => {
    if (!user) throw new Error("Unauthorized");

    return await eventModel.getUserRegistrations(user.id);
};

module.exports = {
    createEvent,
    getMyEvents,
    getModerationQueue,
    moderateEvent,
    getApprovedEvents,
    registerForEvent,
    getMyRegistrations,

};



