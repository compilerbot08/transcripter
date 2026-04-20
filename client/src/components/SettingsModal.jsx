import { useState, useEffect } from "react";
import { useApp, DEFAULT_SETTINGS } from "../contexts/AppContext";
import "./SettingsModal.css";

export default function SettingsModal({ onClose }) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({ ...state.settings });

  // Sync if settings change externally
  useEffect(() => {
    setFormData({ ...state.settings });
  }, [state.settings]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    dispatch({ type: "UPDATE_SETTINGS", payload: formData });
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_SETTINGS, apiKey: formData.apiKey });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h2>⚙ Settings</h2>
          <button className="settings-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-modal__body">
          {/* API Key */}
          <div className="settings-field">
            <label className="settings-field__label">Groq API Key</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleChange("apiKey", e.target.value)}
              placeholder="gsk_..."
              className="settings-field__input"
              id="settings-api-key"
            />
            <span className="settings-field__help">
              Get your key from{" "}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                console.groq.com
              </a>
            </span>
          </div>

          {/* Refresh Interval */}
          <div className="settings-field">
            <label className="settings-field__label">Suggestion Refresh Interval (seconds)</label>
            <input
              type="number"
              min={10}
              max={120}
              value={formData.refreshInterval}
              onChange={(e) => handleChange("refreshInterval", parseInt(e.target.value) || 30)}
              className="settings-field__input settings-field__input--small"
              id="settings-refresh-interval"
            />
          </div>

          {/* Context Windows */}
          <div className="settings-row">
            <div className="settings-field">
              <label className="settings-field__label">Suggestion Context Window</label>
              <input
                type="number"
                min={5}
                max={100}
                value={formData.suggestionContextWindow}
                onChange={(e) => handleChange("suggestionContextWindow", parseInt(e.target.value) || 20)}
                className="settings-field__input settings-field__input--small"
                id="settings-suggestion-ctx"
              />
              <span className="settings-field__help">Number of recent transcript chunks</span>
            </div>
            <div className="settings-field">
              <label className="settings-field__label">Answer Context Window</label>
              <input
                type="number"
                min={5}
                max={100}
                value={formData.answerContextWindow}
                onChange={(e) => handleChange("answerContextWindow", parseInt(e.target.value) || 40)}
                className="settings-field__input settings-field__input--small"
                id="settings-answer-ctx"
              />
              <span className="settings-field__help">Number of recent transcript chunks</span>
            </div>
          </div>

          {/* Prompts */}
          <div className="settings-field">
            <label className="settings-field__label">Suggestion System Prompt</label>
            <textarea
              value={formData.suggestionPrompt}
              onChange={(e) => handleChange("suggestionPrompt", e.target.value)}
              className="settings-field__textarea"
              rows={5}
              id="settings-suggestion-prompt"
            />
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Detailed Answer Prompt</label>
            <textarea
              value={formData.detailPrompt}
              onChange={(e) => handleChange("detailPrompt", e.target.value)}
              className="settings-field__textarea"
              rows={4}
              id="settings-detail-prompt"
            />
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Chat Prompt</label>
            <textarea
              value={formData.chatPrompt}
              onChange={(e) => handleChange("chatPrompt", e.target.value)}
              className="settings-field__textarea"
              rows={4}
              id="settings-chat-prompt"
            />
          </div>
        </div>

        <div className="settings-modal__footer">
          <button className="settings-modal__btn settings-modal__btn--reset" onClick={handleReset}>
            Reset Defaults
          </button>
          <div className="settings-modal__footer-right">
            <button className="settings-modal__btn settings-modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="settings-modal__btn settings-modal__btn--save" onClick={handleSave} id="settings-save">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
