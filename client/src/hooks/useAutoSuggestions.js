import { useEffect, useRef, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { generateSuggestions } from "../services/api";

/**
 * Custom hook that auto-generates suggestions at a configurable interval.
 * Only runs while recording and when there is transcript content.
 * Also exposes a manual refresh function.
 */
export function useAutoSuggestions() {
  const { state, dispatch, getTranscriptText } = useApp();
  const intervalRef = useRef(null);

  const fetchSuggestions = useCallback(async () => {
    const { apiKey, suggestionPrompt, suggestionContextWindow } = state.settings;

    if (!apiKey) return;
    if (state.transcript.length === 0) return;
    if (state.isGeneratingSuggestions) return;

    const transcriptText = getTranscriptText(suggestionContextWindow);
    if (!transcriptText.trim()) return;

    dispatch({ type: "SET_GENERATING_SUGGESTIONS", payload: true });

    try {
      const result = await generateSuggestions(apiKey, transcriptText, suggestionPrompt);
      dispatch({ type: "ADD_SUGGESTION_BATCH", payload: result });
    } catch (err) {
      console.error("[Suggestions Error]", err);
      dispatch({
        type: "SET_ERROR",
        payload: `Suggestion error: ${err.message}`,
      });
    } finally {
      dispatch({ type: "SET_GENERATING_SUGGESTIONS", payload: false });
    }
  }, [state.settings, state.transcript.length, state.isGeneratingSuggestions, getTranscriptText, dispatch]);

  // Auto-refresh interval while recording
  useEffect(() => {
    if (state.isRecording && state.transcript.length > 0) {
      // Generate first batch immediately
      fetchSuggestions();

      intervalRef.current = setInterval(
        fetchSuggestions,
        state.settings.refreshInterval * 1000
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isRecording, state.settings.refreshInterval, state.transcript.length >= 1]); // eslint-disable-line

  return { refreshSuggestions: fetchSuggestions };
}
