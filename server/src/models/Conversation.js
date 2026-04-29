import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  reasoning: { type: String, default: '' },  // DeepSeek R1 推理过程
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: '新对话' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Conversation', conversationSchema);
