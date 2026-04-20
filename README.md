# Live Meeting Copilot

Real-time AI-powered meeting assistant that listens to live audio, transcribes speech, generates context-aware suggestions, and provides a chat interface — all powered by Groq.

## Features

- **Live Transcription** — Captures mic audio in 5-second chunks and transcribes with Groq Whisper Large V3
- **AI Suggestions** — Generates 3 varied suggestions every ~30 seconds based on transcript context
- **Chat Panel** — Click any suggestion for a detailed answer, or ask your own questions
- **Session Export** — Download full transcript, suggestions, and chat as JSON or plain text
- **Configurable** — Editable prompts, context windows, and refresh intervals
- **No Login** — Paste your Groq API key in Settings and go

## Quick Start

### Prerequisites

- Node.js 18+
- A Groq API key ([console.groq.com/keys](https://console.groq.com/keys))

### Setup

```bash
# Clone and install
cd server && npm install
cd ../client && npm install
```

### Run (Development)

Open two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), paste your Groq API key in Settings, and click **Start**.

### Run (Production)

```bash
cd client && npm run build
cd ../server
NODE_ENV=production npm start
```

The server serves the built frontend on port 3001.

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Transcription | Groq Whisper Large V3 | Fast, accurate speech-to-text via Groq's inference API |
| AI Model | GPT-OSS 120B (via Groq) | High-quality suggestions and answers with low latency |
| Backend | Express.js | Minimal, fast Node.js server for 4 API endpoints |
| Frontend | React 18 + Vite | Fast dev builds, HMR, clean component model |
| Styling | Vanilla CSS | Full control, no framework overhead, custom dark theme |

## Prompt Strategy

### Suggestions
The suggestion prompt instructs the model to generate exactly 3 varied suggestions from these categories:
- **Question** — A useful question to ask right now
- **Talking Point** — An important point to bring up
- **Answer** — A direct answer to a question just asked
- **Fact Check** — A correction or verification
- **Clarification** — Making something ambiguous more clear

Suggestions are generated from the most recent N transcript chunks (configurable, default: 20). The model is instructed to return strict JSON for reliable parsing.

### Chat / Detail Answers
When a user clicks a suggestion, the clicked suggestion text plus a broader transcript context (default: 40 chunks) are sent to the model with a detail-focused prompt. User-typed questions use a separate conversational prompt.

All prompts are editable in Settings for full customization.

## Architecture

```
client/                     server/
├── src/                    ├── index.js          (Express entry)
│   ├── App.jsx             ├── routes/
│   ├── contexts/           │   ├── transcribe.js (Whisper)
│   │   └── AppContext.jsx  │   ├── suggestions.js(GPT-OSS)
│   ├── hooks/              │   ├── chat.js       (GPT-OSS)
│   │   ├── useAudioCapture │   └── export.js
│   │   └── useAutoSuggest  └── services/
│   ├── components/             └── groq.js       (SDK wrapper)
│   │   ├── Header
│   │   ├── TranscriptPanel
│   │   ├── SuggestionsPanel
│   │   ├── ChatPanel
│   │   └── SettingsModal
│   └── services/
│       └── api.js
```

## Tradeoffs

1. **Client-side audio chunking** — Using `MediaRecorder.timeslice` (5s) keeps chunks flowing continuously. Smaller chunks = lower latency but more API calls. 5s is a good balance.

2. **No streaming responses** — Groq's API supports streaming but parsing structured JSON from a stream adds complexity. Full responses keep suggestion parsing reliable.

3. **No server-side state** — The API key flows from the client on each request. This simplifies deployment (no session management) but means the key is in transit on every call. HTTPS in production mitigates this.

4. **Frontend context management** — React Context with `useReducer` instead of Redux/Zustand. The app state is simple enough that a single context works well without the overhead.

5. **No persistence** — Sessions reset on reload. This is intentional for privacy in meeting contexts.

## Deployment

### Vercel / Netlify
- Set `client/` as the build directory
- Build command: `npm run build`
- Deploy `server/` as a separate serverless function or API route

### Replit / Railway
- Set `server/` as root
- Build client first: `cd client && npm run build`
- Start: `NODE_ENV=production node server/index.js`
- Set `PORT` environment variable as needed

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN cd client && npm ci && npm run build
RUN cd server && npm ci
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | — | Set to `production` to serve built frontend |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
