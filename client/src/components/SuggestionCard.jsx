import "./SuggestionCard.css";

const CATEGORY_CONFIG = {
  question: { icon: "❓", label: "Question", color: "#3b82f6" },
  talking_point: { icon: "💡", label: "Talking Point", color: "#f59e0b" },
  answer: { icon: "✅", label: "Answer", color: "#22c55e" },
  fact_check: { icon: "🔍", label: "Fact Check", color: "#ef4444" },
  clarification: { icon: "📌", label: "Clarification", color: "#8b5cf6" },
};

export default function SuggestionCard({ suggestion, onClick }) {
  const config = CATEGORY_CONFIG[suggestion.category] || CATEGORY_CONFIG.talking_point;

  return (
    <button
      className="suggestion-card"
      onClick={() => onClick(suggestion)}
      title="Click for detailed answer"
      id={`suggestion-${suggestion.id}`}
    >
      <div className="suggestion-card__header">
        <span className="suggestion-card__category" style={{ color: config.color }}>
          <span className="suggestion-card__category-icon">{config.icon}</span>
          {config.label}
        </span>
      </div>
      <h3 className="suggestion-card__title">{suggestion.title}</h3>
      <p className="suggestion-card__preview">{suggestion.preview}</p>
      <div className="suggestion-card__action">
        <span>Get detailed answer →</span>
      </div>
    </button>
  );
}
