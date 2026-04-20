require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const transcribeRoutes = require("./routes/transcribe");
const suggestionsRoutes = require("./routes/suggestions");
const chatRoutes = require("./routes/chat");
const exportRoutes = require("./routes/export");

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "10mb" }));

// API Routes
app.use("/api/transcribe", transcribeRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/export", exportRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Live Meeting Copilot API running on port ${PORT}`);
});
