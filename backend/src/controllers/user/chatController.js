const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require("../../config/db");

// Initialize Gemini with your free API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleHelpDeskChat = async (req, res) => {
  try {
    const { message } = req.body;
    
    // Extracting user identity and strict organizational boundary
    const org_id = req.user.organization_id || req.user.orgId; // Fallback added for safety
    const user_id = req.user.id; 

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // 1. Multi-Table Join: Events + Organizations + Registrations + Event Team
    const eventsQuery = `
      SELECT 
        e.id, e.title, e.description, e.event_date, e.location, e.capacity,
        o.name AS organization_name,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registered_count,
        COALESCE(
          (SELECT string_agg(u.full_name, ', ') 
           FROM event_team et 
           JOIN users u ON et.user_id = u.id 
           WHERE et.event_id = e.id), 
          'No team assigned'
        ) AS management_team
      FROM events e
      JOIN organizations o ON e.org_id = o.id
      WHERE e.org_id = $1 AND e.status = 'approved' AND e.deleted_at IS NULL
    `;
    
    const eventsResult = await pool.query(eventsQuery, [org_id]);
    const events = eventsResult.rows;

    // 2. Multi-Table Join: User's Personal Registrations
    const userRegQuery = `
      SELECT e.title 
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1 AND e.org_id = $2
    `;
    const userRegResult = await pool.query(userRegQuery, [user_id, org_id]);
    const userRegisteredEvents = userRegResult.rows.map(row => row.title);

    // 3. Format the comprehensive context for the LLM
    let contextString = `Organization Context:\n`;
    if (events.length > 0) {
      contextString += `The user belongs to: ${events[0].organization_name}\n\nUpcoming Events:\n`;
      events.forEach(e => {
        const eventDate = new Date(e.event_date).toLocaleDateString();
        const seatsLeft = e.capacity ? (e.capacity - e.registered_count) : 'Unlimited';
        contextString += `- [${e.title}] Date: ${eventDate} | Location: ${e.location} | Capacity: ${e.capacity || 'N/A'} | Seats Remaining: ${seatsLeft} | Managed By: ${e.management_team} | Details: ${e.description}\n`;
      });
    } else {
      contextString += "No upcoming approved events.\n";
    }

    contextString += `\nUser's Personal Context:\n`;
    if (userRegisteredEvents.length > 0) {
      contextString += `The user asking this question is currently registered for the following events: ${userRegisteredEvents.join(", ")}\n`;
    } else {
      contextString += `The user asking this question is not currently registered for any events.\n`;
    }

    // 4. Construct the Expanded System Prompt
    const prompt = `
    You are a highly capable, friendly, and professional AI Assistant for a college or professional organization. 
    Your goal is to be universally helpful to the student/user.

    RULES FOR ANSWERING:
    1. **Event/Organizational Questions:** If the user asks about schedules, events, their own registrations, or organizational details, you MUST base your answer entirely on the "DATABASE CONTEXT" below. Do not invent event details.
    2. **General Knowledge/Academic Questions:** If the user asks general questions outside the scope of events (e.g., "how to write a resume", "explain quantum physics", "how to cope with exam stress", general advice, code help), draw upon your general broad knowledge to answer them thoroughly, warmly, and accurately. 
    3. You do not need to apologize for information not being in the database if the user is just having a normal conversation or asking a general question. Just answer it naturally.

    DATABASE CONTEXT:
    ${contextString}

    User Question: ${message}
    `;

    // 5. Call the Free Gemini 2.5 Flash Model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    // 6. Send the AI response back to the frontend
    res.status(200).json({ reply: result.response.text() });

    // Debugging info
    console.log("---- AI HELP DESK DEBUG ----");
    console.log("1. Full User Object from Token:", req.user);
    console.log("2. Target Org ID being queried:", org_id);

  } catch (error) {
    console.error("AI Help Desk Error:", error);
    res.status(500).json({ error: "Failed to connect to the AI Help Desk." });
  }
};