const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Create a Groq client instance from a user-provided API key.
 * Each request passes the key from the frontend, so we create a fresh client per call.
 */
function createGroqClient(apiKey) {
  if (!apiKey) {
    throw new Error("Groq API key is required. Please set it in Settings.");
  }
  return new Groq({ apiKey });
}

/**
 * Transcribe an audio buffer using Groq Whisper Large V3.
 * Writes the buffer to a temp file and passes a ReadStream to the Groq SDK,
 * which is the most reliable method in Node.js.
 * @param {Buffer} audioBuffer - Raw audio data
 * @param {string} apiKey - Groq API key
 * @param {string} filename - Original filename for the upload
 * @returns {Promise<{text: string, timestamp: string}>}
 */
async function transcribeAudio(audioBuffer, apiKey, filename = "audio.webm") {
  const client = createGroqClient(apiKey);

  // Write buffer to a temp file — the Groq SDK needs a proper file stream in Node.js
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `copilot_audio_${Date.now()}.webm`);

  try {
    fs.writeFileSync(tmpFile, audioBuffer);

    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
    });

    return {
      text: transcription.text,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Generate a chat completion using a Groq model.
 * @param {string} apiKey - Groq API key
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userMessage - User message content
 * @param {string} model - Model name (default: llama-3.3-70b-versatile)
 * @param {number} temperature - Sampling temperature
 * @returns {Promise<string>} - The assistant's response text
 */
async function chatCompletion(apiKey, systemPrompt, userMessage, model = "llama-3.3-70b-versatile", temperature = 0.7) {
  const client = createGroqClient(apiKey);

  const completion = await client.chat.completions.create(
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: 2048,
    },
    { timeout: 60000 } // 60s timeout to prevent hanging
  );

  return completion.choices[0]?.message?.content || "";
}

module.exports = { createGroqClient, transcribeAudio, chatCompletion };
