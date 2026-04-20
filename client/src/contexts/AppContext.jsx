import { createContext, useContext, useReducer, useCallback, useEffect } from "react";

const AppContext = createContext(null);

// Default prompt templates
const DEFAULT_SETTINGS = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  suggestionPrompt: `You are a real-time meeting copilot analyzing a live conversation transcript. Generate exactly 3 varied, high-value suggestions based on the most recent context. Each suggestion must be one of these categories:
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
[{"title":"...","preview":"...","category":"question|talking_point|answer|fact_check|clarification"}]`,
  detailPrompt: `You are a meeting copilot assistant. The user clicked a suggestion during a live meeting. Provide a detailed, helpful, and well-structured answer based on the suggestion and the meeting transcript context. Be concise but thorough. Use bullet points or numbered lists when appropriate. Focus on actionable insights.`,
  chatPrompt: `You are a helpful meeting copilot assistant. Answer the user's question using the meeting transcript as context. Be direct, specific, and actionable. If the transcript doesn't contain enough information to answer fully, say so and provide what you can.`,
  suggestionContextWindow: 20,
  answerContextWindow: 40,
  refreshInterval: 30,
};

const initialState = {
  transcript: [],
  suggestionBatches: [],
  chatMessages: [],
  settings: { ...DEFAULT_SETTINGS },
  isRecording: false,
  isTranscribing: false,
  isGeneratingSuggestions: false,
  isSendingChat: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TRANSCRIPT":
      return {
        ...state,
        transcript: [...state.transcript, action.payload],
      };
    case "ADD_SUGGESTION_BATCH":
      return {
        ...state,
        suggestionBatches: [action.payload, ...state.suggestionBatches],
      };
    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case "SET_RECORDING":
      return { ...state, isRecording: action.payload };
    case "SET_TRANSCRIBING":
      return { ...state, isTranscribing: action.payload };
    case "SET_GENERATING_SUGGESTIONS":
      return { ...state, isGeneratingSuggestions: action.payload };
    case "SET_SENDING_CHAT":
      return { ...state, isSendingChat: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "RESET_SESSION":
      return {
        ...initialState,
        settings: state.settings,
      };
    default:
      return state;
  }
}

/**
 * Load settings from localStorage if available.
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem("meetingCopilot_settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      // Always prefer env var for API key if set and stored is empty
      if (!merged.apiKey && import.meta.env.VITE_GROQ_API_KEY) {
        merged.apiKey = import.meta.env.VITE_GROQ_API_KEY;
      }
      return merged;
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    settings: loadSettings(),
  });

  // Persist settings on change
  useEffect(() => {
    try {
      localStorage.setItem("meetingCopilot_settings", JSON.stringify(state.settings));
    } catch {
      // Ignore storage errors
    }
  }, [state.settings]);

  // Auto-clear errors after 8 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 8000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  const getTranscriptText = useCallback(
    (windowSize) => {
      const entries = state.transcript.slice(-windowSize);
      return entries.map((t) => `[${t.timestamp}] ${t.text}`).join("\n");
    },
    [state.transcript]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, getTranscriptText }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

export { DEFAULT_SETTINGS };
