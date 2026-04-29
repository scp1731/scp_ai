import { useState, forwardRef } from 'react';

const Sidebar = forwardRef(({ conversations, activeId, onSelect, onNew, onDelete, onUpdateTitle }, ref) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const submitEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdateTitle(editingId, editTitle);
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>AI Chat</h2>
        <button className="btn-new" onClick={onNew}>＋ 新对话</button>
      </div>
      <div className="conversation-list">
        {conversations.map(conv => (
          <div
            key={conv._id}
            className={`conv-item ${conv._id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv._id)}
          >
            {editingId === conv._id ? (
              <input
                className="conv-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={submitEdit}
                onKeyDown={handleEditKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span
                className="conv-title"
                onDoubleClick={(e) => startEdit(conv, e)}
                title="双击编辑标题"
              >
                {conv.title}
              </span>
            )}
            <button
              className="btn-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}
              title="删除对话"
            >
              ✕
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="empty-hint">暂无对话，点击上方按钮新建</p>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
