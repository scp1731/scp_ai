import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { sendMessage, regenerateMessage } from '../api.js';

const MODELS = [
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
];

export default function ChatArea({ conversation, loading, onRefresh, onNew, onUpdateTitle }) {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [streamReasoning, setStreamReasoning] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('deepseek-v4-pro');
  const [thinking, setThinking] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const messagesEnd = useRef(null);
  const abortRef = useRef(null);
  const titleInputRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, streamContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming || !conversation) return;

    setInput('');
    setStreaming(true);
    setStreamContent('');
    setStreamReasoning('');
    setError('');

    abortRef.current = sendMessage(conversation._id, text, { model, thinking }, (data) => {
      if (data.type === 'content') {
        setStreamContent(prev => prev + data.content);
      } else if (data.type === 'reasoning') {
        setStreamReasoning(prev => prev + data.content);
      } else if (data.type === 'done') {
        setStreaming(false);
        onRefresh(data.conversationId);
      } else if (data.type === 'error') {
        setError(data.message);
        setStreaming(false);
      }
    });
  };

  const handleRegenerate = async () => {
    if (!conversation || streaming) return;

    setStreaming(true);
    setStreamContent('');
    setStreamReasoning('');
    setError('');

    abortRef.current = regenerateMessage(conversation._id, { model, thinking }, (data) => {
      if (data.type === 'content') {
        setStreamContent(prev => prev + data.content);
      } else if (data.type === 'reasoning') {
        setStreamReasoning(prev => prev + data.content);
      } else if (data.type === 'done') {
        setStreaming(false);
        onRefresh(data.conversationId);
      } else if (data.type === 'error') {
        setError(data.message);
        setStreaming(false);
      }
    });
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startTitleEdit = () => {
    if (!conversation) return;
    setTitleDraft(conversation.title);
    setEditingTitle(true);
  };

  const submitTitleEdit = () => {
    if (titleDraft.trim() && conversation) {
      onUpdateTitle(conversation._id, titleDraft);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitTitleEdit();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
    }
  };

  // focus input when editing starts
  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  // 空状态
  if (!conversation) {
    return (
      <main className="chat-area">
        <div className="empty-state">
          <h1>🤖 AI Chat</h1>
          <p>基于 DeepSeek 的本地 AI 对话工具</p>
          <button className="btn-start" onClick={onNew}>开始新对话</button>
        </div>
      </main>
    );
  }

  const messages = conversation.messages || [];

  return (
    <main className="chat-area">
      <div className="chat-header">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitleEdit}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <h3 onClick={startTitleEdit} title="点击编辑标题">{conversation.title}</h3>
        )}
        <span className="msg-count">{messages.length} 条消息</span>

        <div className="header-controls">
          <select
            className="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={streaming}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <label className="thinking-toggle" title="开启后 AI 会先思考再回答，质量更高但速度较慢">
            <input
              type="checkbox"
              checked={thinking}
              onChange={(e) => setThinking(e.target.checked)}
              disabled={streaming}
            />
            <span className="toggle-label">💭 深度思考</span>
          </label>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isLast={i === messages.length - 1 && !streaming}
                onRegenerate={handleRegenerate}
              />
            ))}

            {/* 流式输出中的临时消息 */}
            {streaming && (streamContent || streamReasoning) && (
              <div className="message message-assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-body">
                  {streamReasoning && (
                    <details className="reasoning-block" open>
                      <summary>💭 思考中...</summary>
                      <div className="reasoning-content">{streamReasoning}</div>
                    </details>
                  )}
                  <div className="message-content">
                    {streamContent || <span className="typing-cursor">▊</span>}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="error-msg">❌ {error}</div>}
          </>
        )}
        <div ref={messagesEnd} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          rows={2}
          disabled={streaming}
        />
        <div className="input-actions">
          {streaming ? (
            <button className="btn-stop" onClick={handleStop}>⏹ 停止</button>
          ) : (
            <button className="btn-send" onClick={handleSend} disabled={!input.trim()}>
              发送
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
