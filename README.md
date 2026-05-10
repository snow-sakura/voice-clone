# voice-clone

基于 Next.js 16 + 阿里云百炼 DashScope API 构建的 AI 声音克隆网站。支持音色复刻、文本转语音和音色库管理。

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS v4 + shadcn/ui v4 |
| 数据库 | SQLite + Drizzle ORM (better-sqlite3, WAL 模式) |
| 认证 | 自定义 Session (bcryptjs, HTTP-only cookie) |
| 外部 API | 阿里云百炼 DashScope (qwen-voice-enrollment, qwen3-tts-vc) |

## 功能

- **音色复刻** — 上传 3-10 秒音频样本，通过百炼 API 克隆音色
- **文本转语音** — 使用克隆或预设音色，输入文本生成语音
- **音色库** — 管理已克隆音色，支持试听、删除，预设音色可直接使用
- **用户认证** — 注册/登录，Session 管理，音色与用户关联
- **工作台** — 首页展示统计数据与最近活动记录

## 快速开始

### 前置要求

- Node.js 18+
- 阿里云百炼 [DashScope API Key](https://bailian.console.aliyun.com/)

### 安装运行

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env .env.local
# 编辑 .env.local，填入 DASHSCOPE_API_KEY

# 初始化数据库
npx drizzle-kit push

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000，注册账号后即可使用。

### 环境变量

```bash
# 必填：阿里云百炼 API Key
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# 可选：数据库文件路径（默认 ./data/voice-clone.db）
DATABASE_PATH=./data/voice-clone.db
```

## 架构

```
浏览器 ──→ Next.js App Router
              │
              ├── middleware.ts ────→ 认证检查 + 安全头
              │
              ├── (auth)/login, register     (公开页面)
              ├── (dashboard)/               (受保护页面)
              │     ├── page.tsx             工作台首页
              │     ├── clone/page.tsx       音色复刻
              │     ├── tts/page.tsx         文本转语音
              │     └── library/page.tsx     音色库管理
              │
              ├── POST /api/voices/clone  ──→ SQLite ──→ 百炼
              ├── GET  /api/voices         ──→ SQLite + 预设音色
              ├── DEL  /api/voices/[id]    ──→ 所有权验证
              ├── POST /api/tts            ──→ 百炼
              ├── POST /api/auth/register  ──→ SQLite
              ├── POST /api/auth/login     ──→ Session + Cookie
              └── GET  /api/files/...      ──→ 安全文件访问
```

## 数据库

SQLite 文件存储在 `./data/voice-clone.db`（WAL + 外键）。

| 表 | 用途 |
|----|------|
| `users` | 用户（email 唯一, password_hash, name） |
| `sessions` | 会话（HTTP-only cookie, 7天过期） |
| `activities` | 活动记录（clone/tts/delete/login/register） |
| `cloned_voices` | 克隆音色（voice_id, user_id, status） |

迁移文件位于 `./drizzle/`，通过 `drizzle-kit generate` 和 `drizzle-kit push` 管理。

## 百炼 API 流程

音色复刻是**同步**的：

1. 上传 base64 音频 → `/services/audio/tts/customization` → 返回 `voice_id` + 试听音频
2. 使用 `voice_id` + 文本 → `/services/aigc/multimodal-generation/generation` → 返回合成音频

模型：voice enrollment 用 `qwen-voice-enrollment`，TTS 用 `qwen3-tts-vc-2026-01-22`。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run start        # 生产模式启动
npm run lint         # ESLint 检查
npx tsc --noEmit     # TypeScript 类型检查
npx drizzle-kit generate --name "xxx"  # 生成数据库迁移
npx drizzle-kit push # 应用数据库迁移
```

## 项目结构

```
src/
├── app/
│   ├── (auth)/           # 登录/注册（公开）
│   ├── (dashboard)/      # 工作台/克隆/TTS/音色库（受保护）
│   ├── api/              # API 路由
│   └── globals.css       # 主题与设计 token
├── components/
│   ├── layout/           # sidebar, user-menu
│   ├── dashboard/        # stat-card, activity-list, quick-actions
│   ├── auth/             # login-form, register-form
│   └── ui/               # shadcn/ui 组件
├── db/
│   ├── schema.ts         # Drizzle ORM 表定义
│   └── queries.ts        # 数据库查询
├── lib/
│   ├── auth/             # 密码哈希, Session, 用户上下文
│   ├── dashscope.ts      # 百炼 API 客户端
│   ├── audio-helpers.ts  # 音频持久化
│   ├── api-helpers.ts    # 统一错误处理
│   ├── rate-limiter.ts   # 频率限制
│   └── preset-voices.ts  # 预设音色
└── middleware.ts          # 路由保护 + 安全头
```

## 安全

- 密码使用 bcryptjs 哈希 (SALT_ROUNDS=12)
- Session token 为随机 32 字节 hex，HTTP-only cookie，SameSite=Lax
- 频率限制：登录 5次/5分钟，注册 3次/小时，TTS 10次/分钟，克隆 20次/小时
- 文件安全：非 public 目录存储，通过 `/api/files/` 鉴权访问，路径遍历防护
- 安全头：X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
