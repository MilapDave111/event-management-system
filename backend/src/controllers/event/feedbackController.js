const pool = require("../../config/db");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


exports.submitFeedback = async (req, res) => {
  try {
    const { event_id, rating, comment } = req.body;
    const user_id = req.user.id; // From your auth middleware

    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required." });
    }

    // 1. Check if the event exists and has officially ended
    const eventQuery = `SELECT end_datetime FROM events WHERE id = $1`;
    const eventResult = await pool.query(eventQuery, [event_id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    const event = eventResult.rows[0];
    
    if (!event.end_datetime) {
      return res.status(400).json({ error: "This event does not have an official end time recorded." });
    }

    if (new Date() < new Date(event.end_datetime)) {
      return res.status(403).json({ error: "You cannot leave feedback until the event has completely ended." });
    }

    // 2. Check if the user actually registered for this event
    const regQuery = `SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2`;
    const regResult = await pool.query(regQuery, [event_id, user_id]);
    
    if (regResult.rows.length === 0) {
      return res.status(403).json({ error: "You must be registered for this event to leave feedback." });
    }

    // 3. Insert the feedback into the database
    const insertQuery = `
      INSERT INTO feedbacks (event_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const newFeedback = await pool.query(insertQuery, [event_id, user_id, rating, comment]);

    res.status(201).json({ message: "Feedback submitted successfully.", feedback: newFeedback.rows[0] });

  } catch (error) {
    // 23505 is the PostgreSQL error code for a Unique Violation
    if (error.code === '23505') { 
      return res.status(400).json({ error: "You have already submitted feedback for this event." });
    }
    console.error("Feedback Submission Error:", error);
    res.status(500).json({ error: "Server error while submitting feedback." });
  }
};

exports.generateFeedbackSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    // 1. Fetch all feedback for this specific event
    const feedbackQuery = `SELECT rating, comment FROM feedbacks WHERE event_id = $1`;
    const dbResult = await pool.query(feedbackQuery, [eventId]);
    const feedbacks = dbResult.rows;

    // 2. Enforce minimum data threshold
    if (feedbacks.length === 0) {
      return res.status(404).json({ error: "No feedback available for this event yet." });
    }
    if (feedbacks.length < 3) {
      return res.status(400).json({ error: "Not enough data. You need at least 3 reviews to generate a meaningful AI summary." });
    }

    // 3. Aggregate the raw data into a single string
    let rawFeedbackText = `Raw Feedback Data for Event ID ${eventId}:\n`;
    feedbacks.forEach((fb, index) => {
      rawFeedbackText += `Review ${index + 1} - Rating: ${fb.rating}/5 | Comment: "${fb.comment}"\n`;
    });

    // 4. Construct the strict JSON prompt
    const prompt = `
    You are an expert event management data analyst. Analyze the following raw event feedback.
    
    You MUST respond with a raw JSON object and nothing else. Do not use markdown blocks like \`\`\`json.
    
    The JSON must follow this exact structure:
    {
      "averageSentiment": "Positive", "Neutral", or "Negative",
      "executiveSummary": "A strict 3-sentence summary of the overall event reception.",
      "keyStrengths": ["Strength 1", "Strength 2"],
      "coreComplaints": ["Complaint 1", "Complaint 2"],
      "actionableImprovements": ["Action 1", "Action 2"]
    }

    ${rawFeedbackText}
    `;

    // 5. Call the API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    
    // 6. Clean and parse the response
    let responseText = result.response.text().trim();
    // Strip markdown formatting if the AI disobeys instructions
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const jsonSummary = JSON.parse(responseText);

    res.status(200).json({ summary: jsonSummary, totalReviews: feedbacks.length });

  } catch (error) {
    console.error("AI Feedback Summary Error:", error);
    res.status(500).json({ error: "Failed to generate AI summary. The AI may have returned malformed data." });
  }
};