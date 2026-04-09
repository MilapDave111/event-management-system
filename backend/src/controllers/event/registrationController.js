const pool = require("../../config/db");
const logService = require("../../services/admin/logService");
const eventService = require("../../services/event/event.service");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance for ticket purchases
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

// ==========================================
// STUDENT TICKET PAYMENT LOGIC
// ==========================================

const initUserPayment = async (req, res) => {
  try {
    const { eventId, ticket_price } = req.body;
    
    if (!ticket_price || ticket_price <= 0) {
      return res.status(400).json({ message: "Invalid ticket price for this event." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials missing from backend environment variables.");
    }

    const options = {
      amount: Math.round(ticket_price * 100), // Razorpay expects amount in paise
      currency: "INR",
      receipt: `ticket_${Date.now()}_user_${req.user.id}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: options.amount,
      currency: options.currency
    });

  } catch (error) {
    console.error("STUDENT PAYMENT INIT ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to initialize ticket payment" 
    });
  }
};

const verifyUserPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, eventId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment is valid! Register the user for the event using your existing service
      const result = await eventService.registerForEvent(req.user, eventId);
      
      await logService.createLog(
        req.user.id, 
        'PAID_TICKET_REGISTRATION', 
        Number(eventId), 
        `User purchased ticket. Payment ID: ${razorpay_payment_id}`
      );

      res.status(200).json({ 
        success: true, 
        message: "Payment verified and registration complete.",
        data: result
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature. Transaction compromised." });
    }
  } catch (error) {
    console.error("STUDENT VERIFY ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Verification failed." });
  }
};

module.exports = { 
  registerForEvent, 
  getMyRegistrations,
  initUserPayment,
  verifyUserPayment
};