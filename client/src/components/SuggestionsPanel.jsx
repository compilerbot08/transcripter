import { useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { sendChatMessage } from "../services/api";
import SuggestionCard from "./SuggestionCard";
import "./SuggestionsPanel.css";

export default function SuggestionsPanel() {
  const { state, dispatch, getTranscriptText } = useApp();

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

      <div className="suggestions-panel__body">
        {state.suggestionBatches.length === 0 ? (
          <div className="suggestions-panel__empty">
            {state.isRecording ? (
              <>
                <p className="suggestions-panel__empty-icon">⏳</p>
                <p>Waiting for suggestions...</p>
                <p className="text-muted">
                  Suggestions will appear after ~{state.settings.refreshInterval}s of transcript
                </p>
              </>
            ) : (
              <>
                <p className="suggestions-panel__empty-icon">✨</p>
                <p>No suggestions yet</p>
                <p className="text-muted">Start recording to get AI-powered suggestions</p>
              </>
            )}
          </div>
        ) : (
          <div className="suggestions-panel__batches">
            {state.suggestionBatches.map((batch) => (
              <div key={batch.batchId} className="suggestion-batch animate-slide-down">
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
    </div>
  );
}
