import { Router } from 'express';
import Conversation from '../models/Conversation.js';

const router = Router();

// 获取所有对话列表（摘要）
router.get('/', async (req, res) => {
  const conversations = await Conversation.find()
    .select('title createdAt updatedAt')
    .sort({ updatedAt: -1 });
  res.json(conversations);
});

// 获取单个对话详情（含消息）
router.get('/:id', async (req, res) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return res.status(404).json({ error: '对话不存在' });
  res.json(conv);
});

// 新建对话
router.post('/', async (req, res) => {
  const { title } = req.body;
  const conv = await Conversation.create({ title: title || '新对话', messages: [] });
  res.status(201).json(conv);
});

// 删除对话
router.delete('/:id', async (req, res) => {
  await Conversation.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// 更新对话标题
router.patch('/:id', async (req, res) => {
  const { title } = req.body;
  const conv = await Conversation.findByIdAndUpdate(
    req.params.id,
    { title },
    { new: true }
  );
  res.json(conv);
});

export default router;
