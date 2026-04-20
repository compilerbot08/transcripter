const express = require("express");
const { chatCompletion } = require("../services/groq");

const router = express.Router();

/**
 * Default system prompt for generating 3 live suggestions.
 */
const DEFAULT_SUGGESTION_PROMPT = `You are a real-time meeting copilot analyzing a live conversation transcript. Generate exactly 3 varied, high-value suggestions based on the most recent context. Each suggestion must be one of these categories:
- "question": A useful question someone should ask right now
- "talking_point": An important point to bring up
- "answer": A direct answer to a question that was just asked
- "fact_check": A correction or verification of something stated
- "clarification": A clarification of something ambiguous

Requirements:
- Be specific and actionable, not generic
- Reference actual content from the transcript
- Each suggestion must have a different category when possible
- Keep titles under 12 words
- Keep previews under 30 words but make them useful standalone

Respond ONLY with a valid JSON array, no markdown, no code fences:
[{"title":"...","preview":"...","category":"question|talking_point|answer|fact_check|clarification"}]`;

/**
 * POST /api/suggestions
 * Generates exactly 3 suggestions based on transcript context.
 * Body: { apiKey, transcript, systemPrompt? }
 */
router.post("/", async (req, res) => {
  // Set a server-side timeout so this response never hangs indefinitely
  req.setTimeout(90000);
  res.setTimeout(90000);

  try {
    const { apiKey: clientKey, transcript, systemPrompt } = req.body;
    const apiKey = clientKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required. Set it in Settings or in the server .env file." });
    }
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Transcript context is required" });
    }

    const prompt = systemPrompt || DEFAULT_SUGGESTION_PROMPT;
    const userMessage = `Here is the recent meeting transcript:\n\n${transcript}\n\nGenerate exactly 3 suggestions now.`;

    console.log("[Suggestions] Calling Groq API...");
    const response = await chatCompletion(apiKey, prompt, userMessage, "llama-3.3-70b-versatile", 0.8);
    console.log("[Suggestions] Groq API responded successfully");

    // Parse the JSON response — handle potential markdown fencing
    let suggestions;
    try {
      let cleaned = response.trim();
      // Strip markdown code fences if present
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      suggestions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[Suggestions Parse Error]", parseErr.message, "\nRaw:", response);
      return res.status(502).json({
        error: "Failed to parse suggestion response from AI model",
        raw: response,
      });
    }

    // Validate we got an array of 3
    if (!Array.isArray(suggestions) || suggestions.length !== 3) {
      return res.status(502).json({
        error: `Expected 3 suggestions, got ${Array.isArray(suggestions) ? suggestions.length : "non-array"}`,
        raw: response,
      });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    res.json({
      suggestions: suggestions.map((s, i) => ({
        id: `${batchId}_${i}`,
        title: s.title || "Suggestion",
        preview: s.preview || "",
        category: s.category || "talking_point",
      })),
      timestamp: new Date().toISOString(),
      batchId,
    });
  } catch (err) {
    console.error("[Suggestions Error]", err.message);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Suggestion generation failed",
    });
  }
});

module.exports = router;
