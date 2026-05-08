# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作流程

在项目根目录下我创建了一个todo文件，每次在开发之前，你都应该先将我们商量好的代办任务添加到这个文件中。每完成一个任务时，记得把对应的任务标记为已完成，这样可以方便我们实时跟踪开发进度。

合理使用Task工具创建多个子代理来提高开发的效率，每个子代理负责一个独立的任务，互不干扰，支持并行开发。

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npx tsc --noEmit     # TypeScript 类型检查
npx drizzle-kit generate --name "xxx"  # 生成数据库迁移
npx drizzle-kit push # 应用数据库迁移到 SQLite
```

## 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 (strict mode) |
| 样式 | Tailwind CSS v4 + shadcn/ui v4 |
| 数据库 | SQLite + Drizzle ORM (better-sqlite3) |
| 外部 API | 智谱 AI 开放平台 (glm-tts-clone, cogtts) |

## 架构概览

```
浏览器 ──→ Next.js 前端 (React 19 + shadcn/ui)
                │
                ├── POST /api/voices/clone  ──→ SQLite ──→ 智谱 AI /files + /voice/clone
                ├── GET  /api/voices         ──→ SQLite (列表)
                ├── DEL  /api/voices/[id]    ──→ SQLite (删除)
                ├── GET  /api/voices/public  ──→ 硬编码预设音色列表
                └── POST /api/tts            ──→ 智谱 AI /audio/speech → 二进制音频 → public/tts_output/
```

## 智谱 AI API 流程

音色复刻是**同步**的（不需要轮询 taskId）：

```
① POST /files (multipart, 上传音频) → 获取 file_id
② POST /voice/clone (JSON, file_id + text + input) → 获取 voice_id + 试听音频 URL
③ POST /audio/speech (JSON, voice + input) → 返回二进制音频 Buffer
```

详见 `docs/zhipu-ai-api-reference.md`。

## 数据库

单表 `cloned_voices`，SQLite 文件位于 `./data/voice-clone.db`（WAL 模式）。

关键字段：`voice_id`（智谱返回的唯一标识）、`status`（pending/completed/failed）、`demo_audio_url`（试听音频）。

迁移文件位于 `./drizzle/`，配置 `drizzle.config.ts`。

## 项目约定

- 路径别名：`@/*` → `./src/*`（shadcn/ui 自动配置，实际代码中混用相对路径和 `@/`）
- 智谱 API 客户端封装在 `src/lib/zhipu.ts`，参数用 camelCase（内部自动转 snake_case 发给 API）
- API 路由统一使用 `handleApiError()` 处理错误，支持 `ZhipuError` 类型
- 无需性能优化。单用户、本地部署、小型音频文件（3-10 秒）。
- `ZHIPU_API_KEY` 在 `.env.local` 中配置（已加入 .gitignore）
