import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import conversationsRouter from './routes/conversations.js';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/conversations', conversationsRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

await connectDB();

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
});
