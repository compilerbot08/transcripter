import "./ChatMessage.css";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

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
    <div className={`chat-message ${isUser ? "chat-message--user" : "chat-message--assistant"} animate-fade-in`}>
      <div className="chat-message__header">
        <span className="chat-message__role">
          {isUser ? "You" : "Copilot"}
          {message.isSuggestion && " (suggestion)"}
        </span>
        <span className="chat-message__time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="chat-message__content">
        {message.content.split("\n").map((line, i) => (
          <p key={i}>{line || "\u00A0"}</p>
        ))}
      </div>
    </div>
  );
}
