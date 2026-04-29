import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatArea from './components/ChatArea.jsx';
import { getConversations, getConversation, createConversation, deleteConversation, updateConversationTitle } from './api.js';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(false);
  const sidebarRef = useRef();

  const loadList = async () => {
    const list = await getConversations();
    setConversations(list);
  };

  useEffect(() => { loadList(); }, []);

  const selectConv = async (id) => {
    setLoading(true);
    setActiveId(id);
    try {
      const conv = await getConversation(id);
      setActiveConv(conv);
    } finally {
      setLoading(false);
    }
  };

  const newChat = async () => {
    const conv = await createConversation();
    setActiveId(conv._id);
    setActiveConv(conv);
    await loadList();
  };

  const deleteChat = async (id) => {
    await deleteConversation(id);
    if (activeId === id) {
      setActiveId(null);
      setActiveConv(null);
    }
    await loadList();
  };

  const updateTitle = async (id, title) => {
    if (!title.trim()) return;
    await updateConversationTitle(id, title.trim());
    // 更新侧边栏列表
    setConversations(prev =>
      prev.map(c => c._id === id ? { ...c, title: title.trim() } : c)
    );
    // 更新当前对话
    if (activeId === id && activeConv) {
      setActiveConv({ ...activeConv, title: title.trim() });
    }
  };

  const refreshConv = async (idToRefresh) => {
    const id = idToRefresh || activeId;
    if (!id) return;
    const conv = await getConversation(id);
    setActiveConv(conv);
    if (idToRefresh) {
      setActiveId(id);
    }
    await loadList();
  };

  return (
    <div className="app">
      <Sidebar
        ref={sidebarRef}
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConv}
        onNew={newChat}
        onDelete={deleteChat}
        onUpdateTitle={updateTitle}
      />
      <ChatArea
        conversation={activeConv}
        loading={loading}
        onRefresh={refreshConv}
        onNew={newChat}
        onUpdateTitle={updateTitle}
      />
    </div>
  );
}
