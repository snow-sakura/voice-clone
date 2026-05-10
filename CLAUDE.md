# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作流程

在项目根目录下有一个todo文件，每次在开发之前，都应该先将商量好的代办任务添加到这个文件中。每完成一个任务时，记得把对应的任务标记为已完成，方便实时跟踪开发进度。

合理使用Task工具创建多个子代理来提高开发的效率，每个子代理负责一个独立的任务，互不干扰，支持并行开发。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run start        # 生产模式启动
npm run lint         # ESLint 检查
npx tsc --noEmit     # TypeScript 类型检查
npx drizzle-kit generate --name "xxx"  # 生成数据库迁移
npx drizzle-kit push # 应用数据库迁移到 SQLite
```

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS v4 + shadcn/ui v4 |
| 数据库 | SQLite + Drizzle ORM (better-sqlite3, WAL 模式, 外键开启) |
| 认证 | 自定义 Session (bcryptjs, HTTP-only cookie, 7天过期) |
| 外部 API | 阿里云百炼 DashScope (qwen-voice-enrollment, qwen3-tts-vc) |

## 架构概览

```
浏览器 ──→ Next.js App Router
              │
              ├── middleware.ts ──→ 认证检查 + 安全头
              │
              ├── (auth)/login, register     (公开页面，无侧边栏)
              ├── (dashboard)/               (受保护页面，左侧导航)
              │     ├── page.tsx             工作台首页（直接查DB）
              │     ├── clone/page.tsx       音色复刻
              │     ├── tts/page.tsx         文本转语音
              │     └── library/page.tsx     音色库管理
              │
              ├── POST /api/voices/clone  ──→ SQLite ──→ 百炼 (base64 音频直传)
              ├── GET  /api/voices         ──→ SQLite + preset-voices.ts (分页/tab/混合)
              ├── DEL  /api/voices/[id]    ──→ SQLite (所有权验证)
              ├── GET  /api/voices/public  ──→ preset-voices.ts
              ├── POST /api/tts            ──→ 百炼 → 安全目录
              ├── POST /api/auth/register  ──→ SQLite (users + sessions)
              ├── POST /api/auth/login     ──→ SQLite (sessions + cookie)
              ├── POST /api/auth/logout    ──→ 清除 session
              ├── GET  /api/auth/me        ──→ 当前用户信息
              ├── GET  /api/stats          ──→ 统计数据
              ├── GET  /api/activities     ──→ 活动记录
              └── GET  /api/files/...      ──→ 安全文件访问（鉴权+路径遍历防护）
```

## 数据库

4 个表，SQLite 文件位于 `./data/voice-clone.db`（WAL + 外键）。

| 表 | 用途 |
|----|------|
| `users` | 用户表（email 唯一, password_hash, name, avatar） |
| `sessions` | 会话表（user_id FK→users, token 唯一, 7天过期） |
| `activities` | 活动记录（type: clone/tts/delete_voice/login/register, metadata JSON） |
| `cloned_voices` | 克隆音色（user_id FK→users, voice_id 百炼唯一标识, status pending/completed/failed） |

迁移文件位于 `./drizzle/`，配置 `drizzle.config.ts`。`db:push` 后需手动执行 SQL 补列。

## 百炼 API 流程

音色复刻是**同步**的（不需要轮询）：

```
① POST /api/v1/services/audio/tts/customization (JSON, base64 音频 + preferred_name) → voice_id + 试听音频 URL
② POST /api/v1/services/aigc/multimodal-generation/generation (JSON, voice + text) → 音频
```

模型：voice enrollment 用 `qwen-voice-enrollment`，TTS 用 `qwen3-tts-vc-2026-01-22`。

## 认证系统

- 密码：bcryptjs，SALT_ROUNDS=12，要求字母+数字最小8位
- 密码验证：注册时要求字母+数字；密码强度检查在 API 层完成
- Session：随机 token (crypto.randomBytes 32) → hex，HTTP-only cookie (`session_token`)，SameSite=Lax，7天过期
- 中间件：`middleware.ts` — 公开路由放行，受保护路由检查 session_token cookie
- `src/lib/auth/context.ts`：`getCurrentUser()` 从 cookie 获取用户，`requireAuth()` 未登录抛错

## 安全

- **频率限制**：`src/lib/rate-limiter.ts` — 内存 Map 实现，5分钟自动清理
  - 登录：5次/5分钟（成功后重置），注册：3次/小时，TTS：10次/分钟，克隆：20次/小时
- **安全头**：middleware 注入 X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **文件访问**：文件存储在安全目录（非 public），通过 `/api/files/` 鉴权访问，含路径遍历防护
- **文件上传**：MIME 类型 + 扩展名双重验证
- **文件清理**：`src/lib/file-cleanup.ts` — 定时清理 7 天旧文件

## 关键文件

| 文件 | 职责 |
|------|------|
| `src/db/schema.ts` | Drizzle ORM — 4个表定义 + ActivityType 类型 |
| `src/db/queries.ts` | 数据库 CRUD — voices, users, sessions, activities, stats |
| `src/lib/dashscope.ts` | 百炼 API 客户端（voiceClone + tts），参数 camelCase |
| `src/lib/audio-helpers.ts` | 音频持久化，URL/base64/Buffer → 安全目录，路径验证 |
| `src/lib/api-helpers.ts` | `handleApiError()` 统一错误处理，`validateRequired()` 参数校验 |
| `src/lib/preset-voices.ts` | 预设音色列表（Cherry, Serena, Ethan 等 7 个） |
| `src/lib/auth/` | password.ts / session.ts / context.ts / cookie.ts / index.ts |
| `src/lib/rate-limiter.ts` | 频率限制，预定义配置 |
| `src/lib/file-cleanup.ts` | 文件定时清理（cleanupOldFiles, scheduleCleanup） |
| `src/components/voice-list.tsx` | 音色列表共享组件，支持 tab/分页/删除 |
| `src/components/layout/sidebar.tsx` | 左侧导航（工作台/克隆/TTS/音色库） |
| `src/components/dashboard/` | stat-card / activity-list / quick-actions |
| `middleware.ts` | 路由保护 + 安全头注入 |

## 注意事项 / 陷阱

- **音色名清洗**：`dashscope.ts` 的 `voiceClone()` 将中文音色名转拼音空串时，自动生成随机 fallback（`vc{m7x4k}` 格式）。百炼 API 要求 ≤10 个小写字母数字。
- **TTS 响应格式**：`multimodal-generation/generation` 端点返回格式不确定，`extractAudioBuffer()` 按 5 种优先级尝试提取。调试时可查看实际返回 JSON。
- **音量范围**：前端滑块 0~100（百炼格式），不是分贝，默认值 50。
- **API 端点差异**：voice enrollment 用 `/services/audio/tts/customization`，TTS 用 `/services/aigc/multimodal-generation/generation`，路径前缀不同。
- **音色列表混合逻辑**：`GET /api/voices?tab=all` 时第1页返回「预设+克隆」混合，后续页仅克隆。`tab=preset` 不分页。第1页的 total 包含预设数量。
- **VoiceList 组件**：通过 `VoiceItem.source` 区分 `"cloned"` vs `"preset"`，预设音色 `id: null`，删除按钮仅对已克隆音色显示。
- **数据库兼容**：`getVoicesByUserId` 同时查询 `user_id = $userId OR NULL` 以兼容旧数据。

## 项目约定

- 路径别名：`@/*` → `./src/*`
- API 路由统一使用 `handleApiError()` 处理错误
- 无需性能优化。单用户、本地部署、小型音频文件（3-10 秒）。
- `DASHSCOPE_API_KEY` 在 `.env.local` 中配置（已加入 .gitignore）
- `DATABASE_PATH` 可选，默认 `./data/voice-clone.db`
