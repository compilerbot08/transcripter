const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../services/groq");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/transcribe
 * Accepts an audio file and API key, returns transcription text.
 * Body: multipart/form-data with "audio" file and "apiKey" field.
 */
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    const apiKey = req.body.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "API key is required. Set it in Settings or in the server .env file." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const result = await transcribeAudio(
      req.file.buffer,
      apiKey,
      req.file.originalname || "audio.webm"
    );

    res.json(result);
  } catch (err) {
    console.error("[Transcribe Error]", err.message);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Transcription failed",
    });
  }
});

module.exports = router;
