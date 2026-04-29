import { Router } from 'express';
import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// 发送消息（流式返回 SSE）
router.post('/', async (req, res) => {
  const { conversationId, message, model, thinking } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: '缺少 conversationId 或 message' });
  }

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ error: '对话不存在' });

  // 保存用户消息
  conv.messages.push({ role: 'user', content: message });

  // 如果是第一条消息，自动用前20字做标题
  if (conv.title === '新对话' && conv.messages.filter(m => m.role === 'user').length === 1) {
    conv.title = message.slice(0, 20) + (message.length > 20 ? '...' : '');
  }

  // 构建发送给 API 的消息列表
  const apiMessages = conv.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // SSE 头部
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullContent = '';
  let fullReasoning = '';

  try {
    const apiParams = {
      model: model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
      messages: apiMessages,
      stream: true,
    };

    // 深度思考模式
    if (thinking) {
      apiParams.thinking = { type: 'enabled' };
      apiParams.reasoning_effort = 'high';
    }

    const stream = await openai.chat.completions.create(apiParams);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // 处理推理内容（DeepSeek 深度思考）
      if (delta?.reasoning_content) {
        fullReasoning += delta.reasoning_content;
        res.write(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`);
      }

      // 处理正文内容
      if (delta?.content) {
        fullContent += delta.content;
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
      }
    }

    // 保存助手回复
    conv.messages.push({
      role: 'assistant',
      content: fullContent,
      reasoning: fullReasoning,
    });
    await conv.save();

    // 发送完成信号
    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conv._id, title: conv.title })}\n\n`);
    res.end();
  } catch (err) {
    console.error('API 调用失败:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// 重新生成最后一条消息
router.post('/regenerate', async (req, res) => {
  const { conversationId, model, thinking } = req.body;

  const conv = await Conversation.findById(conversationId);
  if (!conv) return res.status(404).json({ error: '对话不存在' });
  if (conv.messages.length === 0) return res.status(400).json({ error: '没有可重新生成的消息' });

  // 移除最后一条 assistant 消息
  const lastMsg = conv.messages[conv.messages.length - 1];
  if (lastMsg.role !== 'assistant') {
    return res.status(400).json({ error: '最后一条不是 AI 回复' });
  }
  conv.messages.pop();
  await conv.save();

  const apiMessages = conv.messages.map(m => ({ role: m.role, content: m.content }));

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullContent = '';
  let fullReasoning = '';

  try {
    const apiParams = {
      model: model || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
      messages: apiMessages,
      stream: true,
    };

    if (thinking) {
      apiParams.thinking = { type: 'enabled' };
      apiParams.reasoning_effort = 'high';
    }

    const stream = await openai.chat.completions.create(apiParams);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.reasoning_content) {
        fullReasoning += delta.reasoning_content;
        res.write(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`);
      }
      if (delta?.content) {
        fullContent += delta.content;
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
      }
    }

    conv.messages.push({ role: 'assistant', content: fullContent, reasoning: fullReasoning });
    await conv.save();

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conv._id, title: conv.title })}\n\n`);
    res.end();
  } catch (err) {
    console.error('API 调用失败:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

export default router;
