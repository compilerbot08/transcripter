const API_BASE = "/api";

/**
 * Transcribe an audio blob via the backend.
 */
export async function transcribeAudio(audioBlob, apiKey) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  formData.append("apiKey", apiKey);

  const res = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Transcription failed" }));
    throw new Error(err.error || `Transcription failed (${res.status})`);
  }

  return res.json();
}

/**
 * Generate 3 suggestions from transcript context.
 */
export async function generateSuggestions(apiKey, transcript, systemPrompt) {
  const res = await fetch(`${API_BASE}/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, transcript, systemPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Suggestion generation failed" }));
    throw new Error(err.error || `Suggestions failed (${res.status})`);
  }

  return res.json();
}

/**
 * Get a chat answer (from clicked suggestion or typed question).
 */
export async function sendChatMessage(apiKey, message, transcript, systemPrompt, isSuggestionClick = false) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, message, transcript, systemPrompt, isSuggestionClick }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Chat failed" }));
    throw new Error(err.error || `Chat failed (${res.status})`);
  }

  return res.json();
}

/**
 * Export session data as JSON or text.
 */
export async function exportSession(data, format = "json") {
  const res = await fetch(`${API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, format }),
  });

  if (!res.ok) {
    throw new Error("Export failed");
  }

  // Trigger download
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = format === "text"
    ? "meeting-copilot-export.txt"
    : "meeting-copilot-export.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
