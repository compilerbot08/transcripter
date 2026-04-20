import { useState } from "react";
import { AppProvider, useApp } from "./contexts/AppContext";
import { useAudioCapture } from "./hooks/useAudioCapture";
import { useAutoSuggestions } from "./hooks/useAutoSuggestions";
import Header from "./components/Header";
import TranscriptPanel from "./components/TranscriptPanel";
import SuggestionsPanel from "./components/SuggestionsPanel";
import ChatPanel from "./components/ChatPanel";
import SettingsModal from "./components/SettingsModal";
import "./App.css";

function AppContent() {
  const { state, dispatch } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  // Hooks lifted to App level so they persist across renders
  const { toggleRecording, isRecording } = useAudioCapture();
  const { refreshSuggestions } = useAutoSuggestions();

  // Show settings on first load if no API key
  const needsSetup = !state.settings.apiKey;

  return (
    <div className="app">
      <Header
        onOpenSettings={() => setShowSettings(true)}
        toggleRecording={toggleRecording}
        isRecording={isRecording}
        refreshSuggestions={refreshSuggestions}
      />

      {/* Error banner */}
      {state.error && (
        <div className="app__error animate-slide-down">
          <span className="app__error-icon">⚠</span>
          <span className="app__error-text">{state.error}</span>
          <button
            className="app__error-close"
            onClick={() => dispatch({ type: "CLEAR_ERROR" })}
          >
            ✕
          </button>
        </div>
      )}

      {/* Setup banner */}
      {needsSetup && !state.error && (
        <div className="app__setup-banner animate-slide-down">
          <span>🔑</span>
          <span>To get started, add your Groq API key in</span>
          <button
            className="app__setup-link"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>
          <span className="text-muted">or set GROQ_API_KEY in server/.env</span>
        </div>
      )}

      <main className="app__main">
        <div className="app__panel app__panel--left">
          <TranscriptPanel />
        </div>
        <div className="app__panel app__panel--center">
          <SuggestionsPanel />
        </div>
        <div className="app__panel app__panel--right">
          <ChatPanel />
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
