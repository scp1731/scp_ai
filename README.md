# AI Chat - DeepSeek

基于 DeepSeek 大模型的 AI 聊天应用，支持多轮对话、对话管理和流式输出。

## 技术栈

| 层 | 技术 |
|---|---|
| **前端** | React 19 + Vite |
| **后端** | Express 5 + OpenAI SDK |
| **数据库** | MongoDB (Mongoose) |
| **AI 模型** | DeepSeek (deepseek-v4-pro) |

## 功能

- 🤖 接入 DeepSeek 大模型，支持流式对话
- 💬 多轮对话，自动保存上下文
- 📁 侧边栏管理多个对话，支持新建/删除/重命名
- 🎨 简洁美观的聊天界面

## 快速开始

### 1. 环境要求

- Node.js >= 18
- MongoDB 运行中（默认 `mongodb://localhost:27017`）

### 2. 配置环境变量

```bash
cd server
# 复制 .env.example 并填入你的 API Key
copy .env.example .env
```

编辑 `server/.env`：

```env
DEEPSEEK_API_KEY=你的API密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
MONGO_URI=mongodb://localhost:27017/ai_chat
PORT=3001
```

> 💡 获取 API Key：[DeepSeek 开放平台](https://platform.deepseek.com/)

### 3. 安装依赖

```bash
# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 4. 启动

**方式一：一键启动（Windows）**

双击 `start.bat`，自动启动服务端和客户端。

**方式二：分别启动**

```bash
# 终端 1 - 启动服务端 (端口 3001)
cd server
npm run dev

# 终端 2 - 启动客户端 (端口 5173)
cd client
npm run dev
```

打开浏览器访问 `http://localhost:5173`

## 项目结构

```
ai_chart_local/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # 组件
│   │   │   ├── ChatArea.jsx        # 聊天区域
│   │   │   ├── MessageBubble.jsx   # 消息气泡
│   │   │   └── Sidebar.jsx         # 侧边栏
│   │   ├── api.js           # API 请求封装
│   │   ├── App.jsx          # 根组件
│   │   └── main.jsx         # 入口
│   └── vite.config.js
├── server/                 # Express 后端
│   ├── src/
│   │   ├── models/         # 数据模型
│   │   │   └── Conversation.js
│   │   ├── routes/         # API 路由
│   │   │   ├── chat.js            # 聊天接口（流式）
│   │   │   └── conversations.js   # 对话管理接口
│   │   ├── db.js           # 数据库连接
│   │   └── index.js        # 服务入口
│   └── .env.example        # 环境变量模板
├── .gitignore
└── start.bat               # Windows 一键启动脚本
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/chat` | 发送消息（SSE 流式响应） |
| GET | `/api/conversations` | 获取对话列表 |
| GET | `/api/conversations/:id` | 获取单个对话 |
| POST | `/api/conversations` | 创建新对话 |
| PATCH | `/api/conversations/:id` | 更新对话标题 |
| DELETE | `/api/conversations/:id` | 删除对话 |
| GET | `/api/health` | 健康检查 |

## License

MIT
