import { useEffect, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import "./TranscriptPanel.css";

export default function TranscriptPanel() {
  const { state } = useApp();
  const bottomRef = useRef(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.transcript.length]);

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="transcript-panel">
      <div className="panel-header">
        <h2 className="panel-header__title">
          <span className="panel-header__icon">📝</span>
          Transcript
        </h2>
        <span className="panel-header__badge">
          {state.transcript.length} chunk{state.transcript.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="transcript-panel__body">
        {state.transcript.length === 0 ? (
          <div className="transcript-panel__empty">
            {state.isRecording ? (
              <>
                <div className="transcript-panel__listening">
                  <span className="transcript-panel__listening-dot" />
                  <span className="transcript-panel__listening-dot" />
                  <span className="transcript-panel__listening-dot" />
                </div>
                <p>Listening...</p>
                <p className="text-muted">Speak naturally — transcript will appear here</p>
              </>
            ) : (
              <>
                <p className="transcript-panel__empty-icon">🎤</p>
                <p>No transcript yet</p>
                <p className="text-muted">Click Start to begin recording</p>
              </>
            )}
          </div>
        ) : (
          <div className="transcript-panel__entries">
            {state.transcript.map((entry, i) => (
              <div key={i} className="transcript-entry animate-fade-in">
                <span className="transcript-entry__time">{formatTime(entry.timestamp)}</span>
                <p className="transcript-entry__text">{entry.text}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {state.isTranscribing && (
          <div className="transcript-panel__status">
            <div className="transcript-panel__spinner" />
            <span>Transcribing...</span>
          </div>
        )}
      </div>

      {/* Mic status bar */}
      <div className={`transcript-panel__footer ${state.isRecording ? "transcript-panel__footer--active" : ""}`}>
        <span className={`transcript-panel__status-dot ${state.isRecording ? "transcript-panel__status-dot--recording" : ""}`} />
        <span>{state.isRecording ? "Recording" : "Idle"}</span>
      </div>
    </div>
  );
}
