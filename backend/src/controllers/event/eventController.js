const pool = require("../../config/db");
const eventService = require("../../services/event/event.service");
const logService = require("../../services/admin/logService");
const sendEmail  = require("../../utils/sendEmail");
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
// const moderateEvent = async (req, res) => {
//   try {
//     const { eventId, status, rejection_reason } = req.body; //

//     // 1. Perform the database update
//     const event = await eventService.moderateEvent(req.user, req.body);

//     // 2. LOG THE ACTION: Using the standardized utility
//     // We use req.user.id for accountability
//     await logService.createLog(
//       req.user.id, 
//       'MODERATE_EVENT', 
//       Number(eventId), 
//       `Event ${status}${rejection_reason ? `: ${rejection_reason}` : ''}`
//     );
//     res.status(200).json(event);
//   } catch (error) {
//     // If logging or the service fails, this sends the 500 error
//     console.error("MODERATION CRASH:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// };

const moderateEvent = async (req, res) => {
  try {
    const { eventId, status, rejection_reason } = req.body; 

    // 1. Database update via Service
    const moderatedEvent = await eventService.moderateEvent(req.user, req.body);
    console.log(`[DEBUG] Event ${eventId} status updated to: ${status}`);

    // 2. Log the action
    await logService.createLog(
      req.user.id, 
      'MODERATE_EVENT', 
      Number(eventId), 
      `Event ${status}${rejection_reason ? `: ${rejection_reason}` : ''}`
    );

    // 3. TASK 7: EMAIL NOTIFICATION LOGIC
    // Logic: Use .toLowerCase() to match 'Approved', 'approved', or 'APPROVED'
    if (status && status.toLowerCase() === 'approved') {
      console.log("[DEBUG] Triggering mass email notification...");

      try {
        // Logic: Using 'true' as a boolean literal to match your DB schema
        const userRes = await pool.query(
          "SELECT email, full_name FROM users WHERE is_verified = true"
        );
        const users = userRes.rows;
        
        console.log(`[DEBUG] Found ${users.length} verified users.`);

        if (users.length > 0) {
          // Logic: Dispatching emails via your nodemailer utility
          const emailPromises = users.map(user => 
           sendEmail({
                    to: user.email,
                    subject: `📢 New Event Live: ${moderatedEvent.title}`,
                    // HTML version for a professional look
                    html: `
                        <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                            <div style="background-color: #47B599; padding: 20px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">SOEMS</h1>
                            </div>
                            <div style="padding: 30px; color: #334155;">
                                <h2 style="color: #1e293b;">Hello ${user.full_name},</h2>
                                <p style="font-size: 16px; line-height: 1.6;">We are excited to announce that a new event has been approved and is now open for registration!</p>
                                
                                <div style="background-color: #f8fafc; border-left: 4px solid #47B599; padding: 15px; margin: 20px 0;">
                                    <h3 style="margin: 0 0 10px 0; color: #47B599;">${moderatedEvent.title}</h3>
                                    <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${new Date(moderatedEvent.event_date).toLocaleDateString()}</p>
                                    <p style="margin: 5px 0;">📍 <strong>Location:</strong> ${moderatedEvent.location || 'Venue TBD'}</p>
                                </div>

                                <p style="font-size: 14px; color: #64748b;">Don't miss out on this opportunity. Spaces are limited!</p>
                                
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="${process.env.FRONTEND_URL}/auth" 
                                       style="background-color: #47B599; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                                       Register Now
                                    </a>
                                </div>
                            </div>
                            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
                                &copy; 2026 Smart Online Event Management System (SOEMS). All rights reserved.
                            </div>
                        </div>
                    `
                })
            );

          await Promise.all(emailPromises);
          console.log("[DEBUG] All emails successfully sent.");
        }
      } catch (emailErr) {
        console.error("[CRITICAL ERROR] Email Dispatch Failed:", emailErr.message);
      }
    }

    res.status(200).json(moderatedEvent);
  } catch (error) {
    console.error("MODERATION CRASH:", error.message);
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
    if (event && event.id) {
      await logService.createLog(
        req.user.id, 
        'CREATE_EVENT', 
        Number(event.id), 
        `Event created: ${event.title}`
      );
    }
   
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. User: Get Approved Events for Discovery


const handleEventLifecycle = async (req, res) => {
  try {
    const { action, eventId } = req.body;
    const result = await eventService.handleLifecycle(req.user, action, eventId);
   await logService.createLog(
      req.user.id, 
      'EVENT_LIFECYCLE', 
      Number(eventId), 
      `Event lifecycle action: ${action}`
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params; // Extracts the "11" from /api/events/11
    const event = await eventService.updateEvent(req.user, id, req.body);
    await logService.createLog(
      req.user.id, 
      'UPDATE_EVENT', 
      Number(id), 
      `Event updated: ${event.title}`
    );
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// exports.assignEventRole = async (req, res) => {
//     try {
//         const { eventId, action, managerId } = req.body;
//         const orgId = req.user.organization_id;

//         // If self-manage, set manager to the current Org Admin's ID
//         const targetManagerId = action === 'self_manage' ? req.user.id : managerId;

//         const result = await eventService.updateEventAuthority(eventId, orgId, targetManagerId);
        
//         res.status(200).json({ success: true, message: "Authority updated", data: result });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


// Add this near your other exports
const assignEventRole = async (req, res) => {
  try {
    const { eventId, action, managerId } = req.body;
    const orgId = req.user.organization_id; // From your auth middleware

    // If the Admin chose "Self Manage", use their own ID. Otherwise, use the selected managerId.
    const targetManagerId = action === 'self_manage' ? req.user.id : managerId;

    if (!targetManagerId) {
      return res.status(400).json({ success: false, message: "Manager ID is required." });
    }

    // Call the service function you just created
    const updatedEvent = await eventService.updateEventAuthority(eventId, orgId, targetManagerId);
   
    // LOG THE ACTION
    await logService.createLog(
      req.user.id, 
      'ASSIGN_EVENT_MANAGER', 
      Number(eventId), 
      `Event manager assigned to user ID ${targetManagerId}`
    );
    res.status(200).json({ 
      success: true, 
      message: "Event Manager assigned successfully", 
      data: updatedEvent 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getManagerStats = async (req, res) => {
  try {
    const stats = {
      total_registrations: 0,
      total_attendance: 0,
      pending_tasks: 0,
      live_checkins: 0
    };
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getManagerScopedEvents = async (req, res) => {
  try {
    const managerId = req.user.id; // Get ID of the logged-in user

    const result = await pool.query(
      `SELECT e.*, u.full_name AS event_manager_name 
       FROM events e
       LEFT JOIN users u ON e.event_manager_id = u.id
       WHERE e.event_manager_id = $1 
         AND e.deleted_at IS NULL
       ORDER BY e.created_at DESC`,
      [managerId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Ensure this function is present
const getMyManagedEvents = async (req, res) => {
  try {
    const managerId = req.user.id;
    const result = await pool.query(
      `SELECT e.*, o.name as organization_name 
       FROM events e
       JOIN organizations o ON e.org_id = o.id
       WHERE e.event_manager_id = $1 
         AND e.deleted_at IS NULL
       ORDER BY e.event_date ASC`,
      [managerId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getTrashEvents = async (req, res) => {
  try {
    const org_id = req.user.organization_id;
    // Specifically query for deleted items
    const result = await pool.query(
      `SELECT * FROM events 
       WHERE org_id = $1 AND deleted_at IS NOT NULL 
       ORDER BY deleted_at DESC`,
      [org_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// CHECK THIS BLOCK at the bottom of the file!
// 
// --- START OF MILAP'S CODE ---
// --- START OF MILAP'S CODE ---
// 6. User: Get Approved Events for Discovery with Search
const getAllApprovedEvents = async (req, res) => {
  try {
    const { search } = req.query; // Get search term from URL
    let query = `
      SELECT e.*, o.name as organization_name 
      FROM events e
      JOIN organizations o ON e.org_id = o.id
      WHERE e.status = 'approved' AND e.deleted_at IS NULL`;
    
    const params = [];

    // Apply search filter if present
    if (search) {
      params.push(`%${search}%`);
      query += ` AND e.title ILIKE $${params.length}`;
    }

    query += " ORDER BY e.event_date ASC";
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- START OF MILAP'S UPDATED CODE ---
const getAdminAllEvents = async (req, res) => {
  try {
    const { search, status } = req.query; // Catch filter params
    let query = `
      SELECT e.*, o.name as organization_name 
      FROM events e 
      JOIN organizations o ON e.org_id = o.id 
      WHERE e.deleted_at IS NULL`;
    
    const params = [];

    // Filter by event title
    if (search) {
      params.push(`%${search}%`);
      query += ` AND e.title ILIKE $${params.length}`;
    }

    // Filter by specific status (pending, approved, rejected)
    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }

    query += ` ORDER BY e.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// --- END OF MILAP'S UPDATED CODE ---
// --- END OF MILAP'S CODE ---
// --- END OF MILAP'S CODE ---

const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const query = `
      SELECT u.full_name, u.email, r.registered_at 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at DESC
    `;
    const result = await pool.query(query, [eventId]);
    // Frontend expects { success: true, data: [...] }
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update your module.exports to include getEventRegistrations


  
module.exports = { 
  getAllEventsForModeration, 
  moderateEvent, 
  getOrgStats, 
  getMyEvents, 
  createEvent,
  getAllApprovedEvents ,
  handleEventLifecycle,
  updateEvent,
  assignEventRole,
  getManagerStats,
  getManagerScopedEvents,
  getMyManagedEvents,
  getTrashEvents,
  getAdminAllEvents ,
  getEventRegistrations
  
};