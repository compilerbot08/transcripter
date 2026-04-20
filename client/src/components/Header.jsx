import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { exportSession } from "../services/api";
import "./Header.css";

export default function Header({ onOpenSettings, toggleRecording, isRecording, refreshSuggestions }) {
  const { state, dispatch } = useApp();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format) => {
    setShowExportMenu(false);
    try {
      await exportSession(
        {
          transcript: state.transcript,
          suggestionBatches: state.suggestionBatches,
          chatMessages: state.chatMessages,
        },
        format
      );
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: `Export failed: ${err.message}` });
    }
  };

  const handleNewSession = () => {
    dispatch({ type: "RESET_SESSION" });
  };

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__brand">
          <span className="header__icon">🎙️</span>
          <h1 className="header__title">Meeting Copilot</h1>
        </div>
      </div>

      <div className="header__center">
        <button
          className={`header__mic-btn ${isRecording ? "header__mic-btn--recording" : ""}`}
          onClick={toggleRecording}
          title={isRecording ? "Stop Recording" : "Start Recording"}
          id="mic-toggle"
        >
          <span className="header__mic-icon">{isRecording ? "⏹" : "▶"}</span>
          <span>{isRecording ? "Stop" : "Start"}</span>
          {isRecording && <span className="header__rec-dot" />}
        </button>

        <button
          className="header__btn"
          onClick={refreshSuggestions}
          disabled={state.transcript.length === 0 || state.isGeneratingSuggestions}
          title="Refresh Suggestions"
          id="refresh-suggestions"
        >
          <span className={state.isGeneratingSuggestions ? "spin-icon" : ""}>↻</span>
          Refresh
        </button>
      </div>

      <div className="header__right">
        <div className="header__export-wrapper">
          <button
            className="header__btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={state.transcript.length === 0 && state.chatMessages.length === 0}
            title="Export Session"
            id="export-btn"
          >
            ↓ Export
          </button>
          {showExportMenu && (
            <div className="header__export-menu animate-fade-in">
              <button onClick={() => handleExport("json")}>Export as JSON</button>
              <button onClick={() => handleExport("text")}>Export as Text</button>
            </div>
          )}
        </div>

        <button
          className="header__btn"
          onClick={handleNewSession}
          title="New Session"
          id="new-session"
        >
          + New
        </button>

        <button
          className="header__btn header__btn--settings"
          onClick={onOpenSettings}
          title="Settings"
          id="settings-btn"
        >
          ⚙
        </button>
      </div>
    </header>
  );
}
