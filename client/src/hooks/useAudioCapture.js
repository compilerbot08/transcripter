import { useRef, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { transcribeAudio } from "../services/api";

/**
 * Custom hook for mic audio capture and chunked transcription.
 * Uses a stop-restart cycle approach instead of timeslice to ensure
 * each audio chunk is a complete, valid webm file with proper headers.
 */
export function useAudioCapture() {
  const { state, dispatch } = useApp();
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(false);

  /**
   * Start a single recording segment, collecting data into chunksRef.
   */
  const startSegment = useCallback((stream) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm",
    });

    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];

      // Skip tiny blobs that won't have meaningful audio
      if (audioBlob.size < 2000) {
        return;
      }

      dispatch({ type: "SET_TRANSCRIBING", payload: true });

      try {
        const result = await transcribeAudio(audioBlob, state.settings.apiKey);

        if (result.text && result.text.trim().length > 0) {
          dispatch({
            type: "ADD_TRANSCRIPT",
            payload: {
              text: result.text.trim(),
              timestamp: result.timestamp || new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        console.error("[Transcription Error]", err);
        dispatch({
          type: "SET_ERROR",
          payload: `Transcription error: ${err.message}`,
        });
      } finally {
        dispatch({ type: "SET_TRANSCRIBING", payload: false });
      }

      // Start next segment if still active
      if (isActiveRef.current && streamRef.current) {
        startSegment(streamRef.current);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
  }, [state.settings.apiKey, dispatch]);

  const startRecording = useCallback(async () => {
    try {
      dispatch({ type: "CLEAR_ERROR" });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      isActiveRef.current = true;

      // Start recording first segment
      startSegment(stream);

      // Stop and restart every 6 seconds to get complete audio files
      intervalRef.current = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop(); // onstop will restart
        }
      }, 6000);

      dispatch({ type: "SET_RECORDING", payload: true });
    } catch (err) {
      console.error("[Mic Error]", err);
      let message = "Failed to access microphone.";
      if (err.name === "NotAllowedError") {
        message = "Microphone permission denied. Please allow microphone access and try again.";
      } else if (err.name === "NotFoundError") {
        message = "No microphone found. Please connect a microphone and try again.";
      }
      dispatch({ type: "SET_ERROR", payload: message });
    }
  }, [dispatch, startSegment]);

  const stopRecording = useCallback(() => {
    isActiveRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    dispatch({ type: "SET_RECORDING", payload: false });
  }, [dispatch]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return { toggleRecording, isRecording: state.isRecording };
}
