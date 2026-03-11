# FMWS Sports - WebSocket 后端服务

一个基于 Node.js + Express + WebSocket 的实时后端服务,主要用于学习和演示 WebSocket 实时通信功能。虽然项目名称为 "Sports",但实际是一个通用的 WebSocket 后端框架,可以应用于各种实时数据推送场景。

## 🚀 项目概述

这是一个现代化的 WebSocket 后端服务,具备以下特性:
- **实时通信**: 基于 WebSocket 协议的实时双向通信
- **发布订阅模式**: 支持按比赛 ID 进行消息订阅和广播
- **数据库集成**: 使用 PostgreSQL + Drizzle ORM 进行数据持久化
- **安全防护**: 集成 Arcjet 安全中间件
- **类型安全**: 使用 Zod 进行数据验证

## 📁 项目结构

```
src/
├── index.js              # 主入口文件
├── arcjet.js             # 安全中间件配置
├── db/
│   ├── db.js             # 数据库连接配置
│   └── schema.js         # 数据库表结构定义
├── routes/
│   ├── match.js          # 比赛相关路由
│   └── commentary.js     # 评论相关路由
├── utils/
│   └── match-status.js   # 比赛状态工具函数
├── validation/
│   └── matches.js        # 数据验证 schema
└── ws/
    └── server.js         # WebSocket 服务器实现
```

## 🛠️ 技术栈

- **运行时**: Node.js (ES Modules)
- **Web框架**: Express.js
- **WebSocket**: ws 库
- **数据库**: PostgreSQL + Drizzle ORM
- **安全**: Arcjet
- **验证**: Zod
- **环境变量**: dotenv

## ⚙️ 环境要求

- Node.js 18+
- PostgreSQL 12+
- npm 或 yarn

## 📦 安装和运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd fmws-sports
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
创建 `.env` 文件并配置以下环境变量:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/fmws_sports
PORT=8000
HOST=0.0.0.0
NODE_ENV=development
```

### 4. 数据库设置
```bash
# 生成数据库迁移文件
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

### 5. 启动服务
```bash
# 开发模式(带文件监听)
npm run dev

# 生产模式
npm start
```

## 🔌 API 接口

### RESTful API

#### 比赛管理
- `GET /matches` - 获取比赛列表
- `POST /matches` - 创建新比赛

#### 评论管理  
- `GET /matches/:id/commentary` - 获取比赛评论
- `POST /matches/:id/commentary` - 添加比赛评论

### WebSocket 连接

WebSocket 服务器运行在:`ws://localhost:8000/ws`

#### 连接示例
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

#### WebSocket 消息类型

**客户端发送消息**:
```json
{
  "type": "subscribe",
  "matchId": 123
}
```

```json
{
  "type": "unsubscribe", 
  "matchId": 123
}
```

**服务端推送消息**:
```json
{
  "type": "welcome",
  "message": "连接成功"
}
```

```json
{
  "type": "match_created",
  "data": {
    "id": 1,
    "sport": "football",
    "homeTeam": "Team A",
    "awayTeam": "Team B",
    "status": "scheduled"
  }
}
```

```json
{
  "type": "commentary", 
  "data": {
    "matchId": 1,
    "minute": 45,
    "message": "进球了!"
  }
}
```

## 🗄️ 数据库设计

### 比赛表 (matches)
- `id` - 主键
- `sport` - 运动类型
- `homeTeam` - 主队
- `awayTeam` - 客队  
- `status` - 比赛状态 (scheduled/live/finished)
- `startTime` - 开始时间
- `endTime` - 结束时间
- `homeScore` - 主队得分
- `awayScore` - 客队得分

### 评论表 (commentary)
- `id` - 主键
- `matchId` - 关联比赛 ID
- `minute` - 比赛分钟
- `sequence` - 事件序列号
- `eventType` - 事件类型
- `message` - 评论内容
- `metadata` - 附加数据

## 🔧 开发脚本

```bash
npm run dev          # 开发模式启动
npm start           # 生产模式启动
npm run db:generate # 生成数据库迁移
npm run db:migrate  # 执行数据库迁移
npm run db:push     # 直接推送数据库结构
```

## 🎯 学习目的

这个项目主要作为 WebSocket 学习和演示用途:
- WebSocket 协议的实际应用
- 实时通信的架构设计
- 发布订阅模式的实现
- 数据库与实时服务的集成
- 安全中间件的配置和使用

## 🚧 待完善功能

- [ ] 用户认证和授权
- [ ] 消息持久化
- [ ] 集群模式支持
- [ ] 性能监控和日志
- [ ] 客户端 SDK 开发

## 📄 许可证

ISC License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目!
