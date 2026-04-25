const pool = require("../../config/db");
const eventService = require("../../services/event/event.service");
const logService = require("../../services/admin/logService");
const sendEmail  = require("../../utils/sendEmail");
const eventModel = require("../../model/event/event.model"); // Required for manual insertions
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Super Admin: Statistics for Dashboard
const getSuperAdminStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(platform_fee) FILTER (WHERE status != 'rejected'), 0) as total_revenue,
        COALESCE(SUM(platform_fee) FILTER (WHERE status = 'rejected'), 0) as total_refunded,
        COUNT(*) FILTER (WHERE status = 'approved') as total_approved_events,
        COUNT(*) FILTER (WHERE platform_fee > 0) as total_paid_events
      FROM events
    `);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ========================================================
// TEAM & SUB-TEAM LOGIC (Freny Integration)
// ========================================================

// 2. Super Admin: Moderation Queue
const getAllEventsForModeration = async (req, res) => {
  try {
    const events = await eventService.getModerationQueue(req.user);
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const moderateEvent = async (req, res) => {
  try {
    const { eventId, status, rejection_reason } = req.body; 

    // Fetch event for refund check before updating
    const eventCheck = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    const event = eventCheck.rows[0];

    if (!event) return res.status(404).json({ message: "Event not found" });

    // REFUND LOGIC: If rejecting a paid event, trigger Razorpay Refund
    if (status === 'rejected' && event.platform_fee > 0 && event.razorpay_payment_id) {
      try {
        await razorpay.payments.refund(event.razorpay_payment_id, {
          amount: Math.round(event.platform_fee * 100),
          speed: "normal",
          notes: { reason: rejection_reason || "Admin rejection" }
        });
        console.log(`[REFUND SUCCESS] Processed for event ${eventId}`);
      } catch (refundErr) {
        console.error("[REFUND ERROR]:", refundErr.message);
      }
    }

    const moderatedEvent = await eventService.moderateEvent(req.user, req.body);
    console.log(`[DEBUG] Event ${eventId} status updated to: ${status}`);

    await logService.createLog(
      req.user.id, 
      'MODERATE_EVENT', 
      Number(eventId), 
      `Event ${status}${status === 'rejected' ? ` (Refunded): ${rejection_reason}` : (rejection_reason ? `: ${rejection_reason}` : '')}`
    );

    if (status && status.toLowerCase() === 'approved') {
      console.log("[DEBUG] Triggering mass email notification...");

      try {
        const userRes = await pool.query(
          "SELECT email, full_name FROM users WHERE is_verified = true"
        );
        const users = userRes.rows;
        
        console.log(`[DEBUG] Found ${users.length} verified users.`);

        if (users.length > 0) {
          const emailPromises = users.map(user => 
           sendEmail({
                    to: user.email,
                    subject: `🚀 New Event Live: ${moderatedEvent.title}`,
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

// Toggle Save (Add/Remove)
exports.toggleSave = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const result = await eventModel.toggleSaveEvent(userId, eventId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Saved Events for the Stats & Wishlist Tab
exports.getSavedEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const saved = await eventModel.getSavedEvents(userId);
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 3. Org Admin: Dashboard Stats
// 3. Org Admin: Dashboard Stats
const getOrgStats = async (req, res) => {
  try {
    const org_id = req.user.organization_id || req.user.org_id;
    
    // SQL calculates unique events, total registrations, and sums ticket prices for revenue
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'approved') as approved_events,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'pending') as pending_events,
        COUNT(r.id) as total_registrations,
        COALESCE(SUM(CASE WHEN e.is_paid_event = TRUE THEN e.ticket_price ELSE 0 END), 0) as total_revenue
       FROM events e
       LEFT JOIN registrations r ON e.id = r.event_id
       WHERE e.org_id = $1`,
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

// 5. Org Admin: Create Event (Auto-approves free events)
const createEvent = async (req, res) => {
  try {
    const { 
      title, description, event_type, event_subtype, scope, location, 
      capacity, poster_url, event_date, start_datetime, end_datetime, status,
      is_paid_event, ticket_price 
    } = req.body;
    
    // FIX: Using organization_id context to satisfy Foreign Key Constraint
    const org_id = req.user.organization_id || req.user.org_id;

<<<<<<< HEAD
    // --- NEW CONSTRAINT CHECK ---
    // Queries the database to see if any active event shares the same date and location
    const conflictCheckQuery = `
      SELECT id FROM events 
      WHERE location = $1 
      AND event_date = $2 
      AND status != 'rejected' 
      AND deleted_at IS NULL 
      LIMIT 1
    `;
    const conflictResult = await pool.query(conflictCheckQuery, [location, event_date]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ message: "Conflict: Another event is already scheduled at this exact location on this day." });
    }
    // -----------------------------

=======
>>>>>>> 85b69858d036ab59462bd5a6dac002622ffe8a54
    const query = `
      INSERT INTO events (
        title, description, event_type, event_subtype, scope, location, 
        capacity, poster_url, event_date, start_datetime, end_datetime, 
        org_id, status, is_paid_event, ticket_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    // UPDATED: If status is not 'draft', set to 'approved' directly
    const targetStatus = status === 'draft' ? 'draft' : 'approved';

    const values = [
      title, description, event_type, event_subtype, scope, location,
      capacity || 0, poster_url, event_date, start_datetime, end_datetime,
      org_id, targetStatus, is_paid_event, ticket_price || 0
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};
<<<<<<< HEAD
=======

>>>>>>> 85b69858d036ab59462bd5a6dac002622ffe8a54
// ==========================================
// MANDATORY PAYMENT LOGIC
// ==========================================

/**
 * 1. Initialize Payment & Create Event Record
 */
const initPayment = async (req, res) => {
  try {
    const { 
      title, description, event_type, event_subtype, scope, location, 
      capacity, poster_url, event_date, start_datetime, end_datetime, 
      is_paid_event, ticket_price, platform_fee_calculated 
    } = req.body;
    
    const org_id = req.user.organization_id || req.user.org_id;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials missing from backend environment variables.");
    }

    const options = {
      amount: Math.round(platform_fee_calculated * 100), 
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const query = `
      INSERT INTO events (
        title, description, event_type, event_subtype, scope, location, 
        capacity, poster_url, event_date, start_datetime, end_datetime, 
        org_id, status, is_paid_event, ticket_price, 
        platform_fee, razorpay_order_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;

    const values = [
      title, description, event_type, event_subtype, scope, location,
      capacity || 0, poster_url, event_date, start_datetime, end_datetime,
      org_id, 'payment_pending', is_paid_event, ticket_price || 0,
      platform_fee_calculated, order.id
    ];

    const result = await pool.query(query, values);
    const eventId = result.rows[0].id;

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: options.amount,
      eventId: eventId
    });

  } catch (error) {
    console.error("PAYMENT INIT ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to initialize payment" 
    });
  }
};

/**
 * 2. Verify Payment (Auto-approves after payment)
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, eventId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment is valid! Update event status directly to 'approved'
      await pool.query(
        `UPDATE events SET status = 'approved', razorpay_payment_id = $1 WHERE id = $2`,
        [razorpay_payment_id, eventId]
      );

      res.status(200).json({ success: true, message: "Payment verified and event approved." });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature." });
    }
  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({ success: false, message: "Verification failed." });
  }
};

// ==========================================

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
    const { id } = req.params; 
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

const assignEventRole = async (req, res) => {
  try {
    const { eventId, action, managerId } = req.body;
    const orgId = req.user.organization_id;

    const targetManagerId = action === 'self_manage' ? req.user.id : managerId;

    if (!targetManagerId) {
      return res.status(400).json({ success: false, message: "Manager ID is required." });
    }

    const updatedEvent = await eventService.updateEventAuthority(eventId, orgId, targetManagerId);
   
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
    const managerId = req.user.id;

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

const getAllApprovedEvents = async (req, res) => {
  try {
    const { search } = req.query; 
    const userOrgId = req.user.organization_id || req.user.org_id;
    if (!userOrgId) {
      return res.status(400).json({ message: "User organization context is missing." });
    }

    let query = `
      SELECT e.*, o.name as organization_name 
      FROM events e
      JOIN organizations o ON e.org_id = o.id
      WHERE e.status = 'approved' 
        AND e.deleted_at IS NULL 
        AND e.org_id = $1`; 

    const params = [userOrgId];

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

const getAdminAllEvents = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT e.*, o.name as organization_name 
      FROM events e 
      JOIN organizations o ON e.org_id = o.id 
      WHERE e.deleted_at IS NULL`;
    
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND e.title ILIKE $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND e.status =$${params.length}`;
    }

    query += ` ORDER BY e.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateGlobalAiPoster = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const finalPrompt = `${prompt}, professional promotional background poster, 4k resolution, highly detailed, empty space for text, no words, no letters`;

    const models = [
      "https://api-inference.huggingface.co/models/Lykon/dreamshaper-xl-1.0",
      "https://api-inference.huggingface.co/models/SG161222/RealVisXL_V4.0",
      "https://api-inference.huggingface.co/models/cagliostrolab/animagine-xl-3.1"
    ];

    let response;
    let success = false;

    for (const modelUrl of models) {
      console.log(`[AI Generator] Attempting to use model: ${modelUrl}`);
      
      response = await fetch(modelUrl, {
        headers: { 
          Authorization: `Bearer ${process.env.HF_TOKEN}`, 
          "Content-Type": "application/json" 
        },
        method: "POST",
        body: JSON.stringify({ inputs: finalPrompt }),
      });

      if (response.ok) {
        console.log(`[AI Generator] Success! Image generated using: ${modelUrl}`);
        success = true;
        break; 
      } else {
        console.warn(`[AI Generator] Model failed with status ${response.status}. Trying next model...`);
      }
    }

    if (!success) {
      return res.status(500).json({ error: "All free AI models are currently overloaded or offline. Please try again in 5 minutes." });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Server failed to process the AI request." });
  }
};

const toggleSave = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;
    const result = await eventModel.toggleSaveEvent(userId, eventId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSavedEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const saved = await eventModel.getSavedEvents(userId);
    res.status(200).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { 
  getSuperAdminStats,
  getAllEventsForModeration, 
  moderateEvent, 
  getOrgStats, 
  getMyEvents, 
  createEvent,
  initPayment,
  verifyPayment,
  getAllApprovedEvents ,
  handleEventLifecycle,
  updateEvent,
  assignEventRole,
  getManagerStats,
  getManagerScopedEvents,
  getMyManagedEvents,
  getTrashEvents,
  getAdminAllEvents ,
  getEventRegistrations,
  generateGlobalAiPoster,
  toggleSave,
  getSavedEvents
  
};