const pool = require("../../config/db");

/**
 * Insert Event
 */
const insertEvent = async (data) => {
  const {
    org_id,
    title,
    description,
    event_date,
    location,
    capacity,
    start_datetime,
    end_datetime,
    status,
    event_type,
    event_subtype,
    scope,
    poster_url
  } = data;

  const query = `
    INSERT INTO events 
    (
      org_id,
      title,
      description,
      event_date,
      location,
      capacity,
      start_datetime,
      end_datetime,
      status,
      event_type,
      event_subtype,
      scope,
      poster_url
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *;
  `;

  const values = [
    org_id,
    title,
    description || null,
    event_date,
    location || null,
    capacity || null,
    start_datetime || null,
    end_datetime || null,
    status,
    event_type || null,
    event_subtype || null,
    scope || null,
    poster_url || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get Events By Organization
 */
const getEventsByOrg = async (orgId) => {
  // We use a LEFT JOIN to grab the user's full_name and attach it as event_manager_name
  const query = `
    SELECT 
      e.*, 
      u.full_name AS event_manager_name 
    FROM events e
    LEFT JOIN users u ON e.event_manager_id = u.id
    WHERE e.org_id = $1 
      AND e.deleted_at IS NULL
    ORDER BY e.created_at DESC;
  `;
  
  const result = await pool.query(query, [orgId]);
  return result.rows;
};
/**
 * Get All Events for Moderation
 */
const getAllEventsWithOrg = async () => {
  const query = `
    SELECT e.*, o.name as organization_name
    FROM events e
    LEFT JOIN organizations o ON e.org_id = o.id
    ORDER BY e.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

/**
 * Update Event Status
 */
const updateEventStatus = async (eventId, status, rejection_reason) => {
  const query = `
    UPDATE events
    SET status = $1,
        rejection_reason = $2
    WHERE id = $3
    RETURNING *;
  `;

  const result = await pool.query(query, [
    status,
    rejection_reason || null,
    eventId
  ]);

  return result.rows[0];
};

/**
 * Get All Approved Events (for Users)
 */
const getApprovedEvents = async () => {
  const query = `
    SELECT e.*, o.name as organization_name
    FROM events e
    JOIN organizations o ON e.org_id = o.id
    WHERE e.status = 'approved'
    ORDER BY e.event_date ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};
/**
 * Register User for Event
 */
const registerUser = async (userId, eventId) => {
  const query = `
    INSERT INTO registrations (user_id, event_id)
    VALUES ($1, $2)
    RETURNING *;
  `;

  const result = await pool.query(query, [userId, eventId]);
  return result.rows[0];
};

/**
 * Check Event Status
 */
const getEventStatus = async (eventId) => {
  const query = `SELECT status FROM events WHERE id = $1`;
  const result = await pool.query(query, [eventId]);
  return result.rows[0];
};

/**
 * Get User Registrations
 */
const getUserRegistrations = async (userId) => {
  const query = `
    SELECT e.*, o.name as organization_name 
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    JOIN organizations o ON e.org_id = o.id
    WHERE r.user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Soft Delete Event
 */
const softDeleteEvent = async (eventId) => {
  const query = `UPDATE events SET deleted_at = NOW(), status = 'cancelled' WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [eventId]);
  return result.rows[0];
};

/**
 * Restore Soft Deleted Event
 */
const restoreEvent = async (eventId) => {
  const query = `UPDATE events SET deleted_at = NULL, status = 'draft' WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [eventId]);
  return result.rows[0];
};

/**
 * Archive Event
 */
const archiveEvent = async (eventId) => {
  const query = `UPDATE events SET is_archived = TRUE, status = 'archived' WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [eventId]);
  return result.rows[0];
};

/**
 * Clone Event (Deep Copy)
 */
const cloneEvent = async (eventId) => {
  const query = `
    INSERT INTO events (org_id, title, description, event_date, location, capacity, start_datetime, end_datetime, status, event_type, event_subtype, scope, poster_url)
    SELECT org_id, CONCAT(title, ' (Copy)'), description, event_date, location, capacity, start_datetime, end_datetime, 'draft', event_type, event_subtype, scope, poster_url
    FROM events WHERE id = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [eventId]);
  return result.rows[0];
};

module.exports = {
  insertEvent,
  getEventsByOrg,
  getAllEventsWithOrg,
  updateEventStatus,
  getApprovedEvents,
    registerUser,
    getEventStatus,
    getUserRegistrations,
    softDeleteEvent,
  restoreEvent,
  archiveEvent,
  cloneEvent

};



