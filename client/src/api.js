const API_BASE = '/api';

export async function getConversations() {
  const res = await fetch(`${API_BASE}/conversations`);
  return res.json();
}

export async function getConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`);
  return res.json();
}

export async function createConversation(title) {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function deleteConversation(id) {
  await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
}

export async function updateConversationTitle(id, title) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

// 流式聊天，返回 AbortController 用于取消
export function sendMessage(conversationId, message, options, onChunk) {
  const { model, thinking } = options || {};
  const controller = new AbortController();

  fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message, model, thinking }),
    signal: controller.signal,
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onChunk(data);
          } catch { /* 忽略解析错误 */ }
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onChunk({ type: 'error', message: err.message });
    }
  });

  return controller;
}

// 重新生成
export function regenerateMessage(conversationId, options, onChunk) {
  const { model, thinking } = options || {};
  const controller = new AbortController();

  fetch(`${API_BASE}/chat/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, model, thinking }),
    signal: controller.signal,
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onChunk(data);
          } catch { /* ignore */ }
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onChunk({ type: 'error', message: err.message });
    }
  });

  return controller;
}
