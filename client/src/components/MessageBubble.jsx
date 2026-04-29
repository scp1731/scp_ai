export default function MessageBubble({ message, isLast, onRegenerate }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const hasReasoning = isAssistant && message.reasoning;

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="message-body">
        {hasReasoning && (
          <details className="reasoning-block">
            <summary>💭 思考过程</summary>
            <div className="reasoning-content">{message.reasoning}</div>
          </details>
        )}
        <div className="message-content">{message.content}</div>
        {isAssistant && isLast && (
          <button className="btn-regenerate" onClick={onRegenerate}>🔄 重新生成</button>
        )}
      </div>
    </div>
  );
}
