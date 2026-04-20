const express = require("express");

const router = express.Router();

/**
 * POST /api/export
 * Assembles session data into a downloadable format.
 * Body: { transcript, suggestionBatches, chatMessages, format? }
 * format: "json" (default) or "text"
 */
router.post("/", (req, res) => {
  try {
    const { transcript, suggestionBatches, chatMessages, format } = req.body;

    const sessionData = {
      exportedAt: new Date().toISOString(),
      transcript: transcript || [],
      suggestionBatches: suggestionBatches || [],
      chatMessages: chatMessages || [],
    };

    if (format === "text") {
      let text = `=== Live Meeting Copilot Export ===\n`;
      text += `Exported: ${sessionData.exportedAt}\n\n`;

      text += `--- TRANSCRIPT ---\n`;
      (sessionData.transcript || []).forEach((t) => {
        text += `[${t.timestamp}] ${t.text}\n`;
      });

      text += `\n--- SUGGESTIONS ---\n`;
      (sessionData.suggestionBatches || []).forEach((batch) => {
        text += `\nBatch (${batch.timestamp}):\n`;
        (batch.suggestions || []).forEach((s, i) => {
          text += `  ${i + 1}. [${s.category}] ${s.title}\n     ${s.preview}\n`;
        });
      });

      text += `\n--- CHAT ---\n`;
      (sessionData.chatMessages || []).forEach((m) => {
        text += `[${m.timestamp}] ${m.role}: ${m.content}\n`;
      });

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", "attachment; filename=meeting-copilot-export.txt");
      res.send(text);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=meeting-copilot-export.json");
      res.json(sessionData);
    }
  } catch (err) {
    console.error("[Export Error]", err.message);
    res.status(500).json({ error: "Export failed" });
  }
});

module.exports = router;
