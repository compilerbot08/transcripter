import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../contexts/AppContext";
import { sendChatMessage } from "../services/api";
import ChatMessage from "./ChatMessage";
import "./ChatPanel.css";

export default function ChatPanel() {
  const { state, dispatch, getTranscriptText } = useApp();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.chatMessages.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const { apiKey, chatPrompt, answerContextWindow } = state.settings;

    if (!apiKey) {
      dispatch({ type: "SET_ERROR", payload: "Please set your Groq API key in Settings." });
      return;
    }

    // Add user message
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      payload: {
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      },
    });

    setInput("");
    dispatch({ type: "SET_SENDING_CHAT", payload: true });

    try {
      const transcriptText = getTranscriptText(answerContextWindow);
      const result = await sendChatMessage(apiKey, text, transcriptText, chatPrompt, false);

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
  }, [input, state.settings, getTranscriptText, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <h2 className="panel-header__title">
          <span className="panel-header__icon">💬</span>
          Chat
        </h2>
        <span className="panel-header__badge">
          {state.chatMessages.length} msg{state.chatMessages.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="chat-panel__body">
        {state.chatMessages.length === 0 ? (
          <div className="chat-panel__empty">
            <p className="chat-panel__empty-icon">💬</p>
            <p>No messages yet</p>
            <p className="text-muted">
              Click a suggestion or type a question below
            </p>
          </div>
        ) : (
          <div className="chat-panel__messages">
            {state.chatMessages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {state.isSendingChat && (
              <div className="chat-panel__typing animate-fade-in">
                <div className="chat-panel__typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>Copilot is thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="chat-panel__input-area">
        <div className="chat-panel__input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the meeting..."
            rows={1}
            id="chat-input"
          />
          <button
            className="chat-panel__send-btn"
            onClick={handleSend}
            disabled={!input.trim() || state.isSendingChat}
            title="Send message"
            id="chat-send"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
