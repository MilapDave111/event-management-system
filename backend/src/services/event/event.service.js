const eventModel = require("../../model/event/event.model");
const pool = require("../../config/db");
/**
 * Create Event (ORG_ADMIN)
 * Supports 'Save as Draft' and 'Submit for Approval' logic.
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
    poster_url,
    status = "draft", // Default to 'draft' per management requirements
    event_manager_id = null
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

  // Strategic Authority: If no manager assigned, the Org Admin is the authority
  return await eventModel.insertEvent({
    org_id: user.organization_id,
    title,
    description,
    event_date,
    location,
    capacity,
    start_datetime: derivedStart,
    end_datetime: derivedEnd,
    status: status, // Supports transitions like 'draft' or 'pending'
    event_type,
    event_subtype,
    scope,
    poster_url,
    event_manager_id: event_manager_id || null 
  });
};

/**
 * Lifecycle Router (ORG_ADMIN)
 * Handles Soft Delete, Restore, Archive, and Clone actions.
 */
const handleLifecycle = async (user, action, eventId) => {
  if (!user || user.role !== "ORG_ADMIN") {
    throw new Error("Unauthorized");
  }

  if (!eventId || !action) {
    throw new Error("Event ID and action are required");
  }

  switch (action) {
    case 'delete':
      return await eventModel.softDeleteEvent(eventId);
    
    case 'restore':
      return await eventModel.restoreEvent(eventId);
    
    case 'archive':
      return await eventModel.archiveEvent(eventId);
    
    case 'clone':
      return await eventModel.cloneEvent(eventId);
    
    case 'unarchive':
      // 1. Define the query
      const unarchiveQuery = `
        UPDATE events 
        SET is_archived = FALSE, 
            status = 'draft' 
        WHERE id = $1 AND org_id = $2 
        RETURNING *;
      `;
      // 2. Execute the query using the pool and return the result
      const result = await pool.query(unarchiveQuery, [eventId, user.organization_id]);
      
      if (result.rows.length === 0) {
        throw new Error("Event not found or you do not have permission to unarchive it");
      }
      
      return result.rows[0];

    default:
      throw new Error("Invalid Lifecycle Action");
  }
};
/**
 * Get Events for ORG_ADMIN
 */
// Suggested logic for getMyEvents in your service file
const getMyEvents = async (user) => {
  // Use organization_id to ensure managers see everything in their org
  const query = `
    SELECT e.*, u.full_name as event_manager_name 
    FROM events e
    LEFT JOIN users u ON e.event_manager_id = u.id
    WHERE e.org_id = $1 
      AND e.deleted_at IS NULL`;
      
  const result = await pool.query(query, [user.organization_id]);
  return result.rows;
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

const updateEvent = async (user, eventId, updateData) => {
  const query = `
    UPDATE events 
    SET title = $1, 
        description = $2, 
        event_type = $3, 
        event_subtype = $4, 
        scope = $5, 
        location = $6, 
        capacity = $7, 
        poster_url = $8, 
        event_date = $9, 
        start_datetime = $10, 
        end_datetime = $11, 
        status = $12, -- ENSURE STATUS IS INCLUDED
        updated_at = NOW()
    WHERE id = $13 AND org_id = $14
    RETURNING *;
  `;

  const values = [
    updateData.title,
    updateData.description,
    updateData.event_type,
    updateData.event_subtype,
    updateData.scope,
    updateData.location,
    updateData.capacity,
    updateData.poster_url,
    updateData.event_date,
    updateData.start_datetime,
    updateData.end_datetime,
    updateData.status, // New status ('pending' or 'draft')
    eventId,
    user.organization_id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateEventAuthority = async (eventId, orgId, managerId) => {
    // 1. Update the event record to assign the manager
    const updateEventQuery = `
        UPDATE events 
        SET event_manager_id = $1 
        WHERE id = $2 AND org_id = $3 
        RETURNING *;
    `;
    const eventResult = await pool.query(updateEventQuery, [managerId, eventId, orgId]);

    if (eventResult.rows.length === 0) {
        throw new Error("Event not found or unauthorized.");
    }

    // 2. Update the User's Role to 'EVENT_MANAGER'
    // SAFETY CHECK: We use a WHERE clause to ensure we do NOT downgrade 
    // an ORG_ADMIN or SUPER_ADMIN if they assign themselves.
    const updateUserQuery = `
        UPDATE users 
        SET role = 'EVENT_MANAGER' 
        WHERE id = $1 
          AND role NOT IN ('ORG_ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER');
    `;
    
    await pool.query(updateUserQuery, [managerId]);

    return eventResult.rows[0];
};

// Add updateEvent to module.exports
module.exports = {
    createEvent,
    handleLifecycle,
    getMyEvents,
    getModerationQueue,
    moderateEvent,
    getApprovedEvents,
    registerForEvent,
    getMyRegistrations,
    updateEvent,
    updateEventAuthority
};