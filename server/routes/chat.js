const express = require("express");
const { chatCompletion } = require("../services/groq");

const router = express.Router();

const DEFAULT_DETAIL_PROMPT = `You are a meeting copilot assistant. The user clicked a suggestion during a live meeting. Provide a detailed, helpful, and well-structured answer based on the suggestion and the meeting transcript context. Be concise but thorough. Use bullet points or numbered lists when appropriate. Focus on actionable insights.`;

const DEFAULT_CHAT_PROMPT = `You are a helpful meeting copilot assistant. Answer the user's question using the meeting transcript as context. Be direct, specific, and actionable. If the transcript doesn't contain enough information to answer fully, say so and provide what you can.`;

/**
 * POST /api/chat
 * Generates a detailed answer for a chat message or clicked suggestion.
 * Body: { apiKey, message, transcript, systemPrompt?, isSuggestionClick? }
 */
router.post("/", async (req, res) => {
  try {
    const { apiKey: clientKey, message, transcript, systemPrompt, isSuggestionClick } = req.body;
    const apiKey = clientKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required. Set it in Settings or in the server .env file." });
    }
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Use appropriate default prompt based on whether this is a suggestion click or user chat
    const defaultPrompt = isSuggestionClick ? DEFAULT_DETAIL_PROMPT : DEFAULT_CHAT_PROMPT;
    const prompt = systemPrompt || defaultPrompt;

    let userMessage;
    if (transcript && transcript.trim().length > 0) {
      userMessage = `Meeting transcript context:\n${transcript}\n\n${isSuggestionClick ? "Suggestion to expand on" : "User question"}: ${message}`;
    } else {
      userMessage = message;
    }

    const answer = await chatCompletion(apiKey, prompt, userMessage, "llama-3.3-70b-versatile", 0.7);

    res.json({
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Chat Error]", err.message);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Chat response failed",
    });
  }
});

module.exports = router;
