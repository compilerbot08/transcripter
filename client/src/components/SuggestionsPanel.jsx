import { useCallback, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { sendChatMessage } from "../services/api";
import SuggestionCard from "./SuggestionCard";
import "./SuggestionsPanel.css";

export default function SuggestionsPanel() {
  const { state, dispatch, getTranscriptText } = useApp();
  const [activeTab, setActiveTab] = useState("latest"); // "latest" or "history"

  // Split batches into Latest (first one) and History (the rest)
  const latestBatch = state.suggestionBatches[0] || null;
  const historyBatches = state.suggestionBatches.slice(1);

  const handleSuggestionClick = useCallback(
    async (suggestion) => {
      const { apiKey, detailPrompt, answerContextWindow } = state.settings;

      if (!apiKey) {
        dispatch({ type: "SET_ERROR", payload: "Please set your Groq API key in Settings." });
        return;
      }

      // Add user message to chat
      const userMsg = `📌 ${suggestion.title}\n${suggestion.preview}`;
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: {
          role: "user",
          content: userMsg,
          timestamp: new Date().toISOString(),
          isSuggestion: true,
        },
      });

      dispatch({ type: "SET_SENDING_CHAT", payload: true });

      try {
        const transcriptText = getTranscriptText(answerContextWindow);
        const result = await sendChatMessage(
          apiKey,
          `${suggestion.title}: ${suggestion.preview}`,
          transcriptText,
          detailPrompt,
          true
        );

        dispatch({
          type: "ADD_CHAT_MESSAGE",
          payload: {
            role: "assistant",
            content: result.answer,
            timestamp: result.timestamp,
          },
        });
      } catch (err) {
        dispatch({
          type: "SET_ERROR",
          payload: `Chat error: ${err.message}`,
        });
      } finally {
        dispatch({ type: "SET_SENDING_CHAT", payload: false });
      }
    },
    [state.settings, getTranscriptText, dispatch]
  );

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="suggestions-panel">
      <div className="panel-header">
        <h2 className="panel-header__title">
          <span className="panel-header__icon">✨</span>
          Suggestions
        </h2>
        {state.isGeneratingSuggestions && (
          <div className="suggestions-panel__generating">
            <div className="transcript-panel__spinner" />
            <span>Generating...</span>
          </div>
        )}
      </div>

      <div className="suggestions-panel__tabs">
        <button
          className={`suggestions-panel__tab ${activeTab === "latest" ? "active" : ""}`}
          onClick={() => setActiveTab("latest")}
        >
          Latest
          {latestBatch && <span className="tab-indicator" />}
        </button>
        <button
          className={`suggestions-panel__tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History
          {historyBatches.length > 0 && (
            <span className="tab-badge">{historyBatches.length}</span>
          )}
        </button>
      </div>

      <div className="suggestions-panel__body">
        {activeTab === "latest" ? (
          <div className="suggestions-panel__latest animate-fade-in">
            {!latestBatch ? (
              <div className="suggestions-panel__empty">
                {state.isRecording ? (
                  <>
                    <p className="suggestions-panel__empty-icon">⏳</p>
                    <p>Waiting for suggestions...</p>
                  </>
                ) : (
                  <>
                    <p className="suggestions-panel__empty-icon">✨</p>
                    <p>No suggestions yet</p>
                    <p className="text-muted">Start recording to see live suggestions</p>
                  </>
                )}
              </div>
            ) : (
              <div className="suggestion-batch">
                <div className="suggestion-batch__header">
                  <span className="suggestion-batch__time">Received {formatTime(latestBatch.timestamp)}</span>
                  <span className="suggestion-batch__divider" />
                </div>
                <div className="suggestion-batch__cards">
                  {latestBatch.suggestions.map((s) => (
                    <SuggestionCard
                      key={s.id}
                      suggestion={s}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </div>
                <p className="suggestions-panel__tip">
                  Clicking "Refresh" will move these to **History**.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="suggestions-panel__history animate-fade-in">
            {historyBatches.length === 0 ? (
              <div className="suggestions-panel__empty">
                <p className="suggestions-panel__empty-icon">📂</p>
                <p>History is empty</p>
                <p className="text-muted">Old suggestions appear here after a refresh</p>
              </div>
            ) : (
              <div className="suggestions-panel__batches">
                {historyBatches.map((batch) => (
                  <div key={batch.batchId} className="suggestion-batch">
                    <div className="suggestion-batch__header">
                      <span className="suggestion-batch__time">{formatTime(batch.timestamp)}</span>
                      <span className="suggestion-batch__divider" />
                    </div>
                    <div className="suggestion-batch__cards">
                      {batch.suggestions.map((s) => (
                        <SuggestionCard
                          key={s.id}
                          suggestion={s}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
