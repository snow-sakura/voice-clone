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
| 外部 API | 阿里云百炼 DashScope (qwen-voice-enrollment, qwen3-tts-vc) |

## 架构概览

```
浏览器 ──→ Next.js 前端 (React 19 + shadcn/ui)
                │
                ├── POST /api/voices/clone  ──→ SQLite ──→ 百炼 /audio/tts/customization (base64 音频直传)
                ├── GET  /api/voices         ──→ SQLite (列表)
                ├── DEL  /api/voices/[id]    ──→ SQLite (删除)
                ├── GET  /api/voices/public  ──→ 硬编码预设音色列表
                └── POST /api/tts            ──→ 百炼 /aigc/multimodal-generation/generation → 音频 → public/tts_output/
```

## 百炼 API 流程

音色复刻是**同步**的（不需要轮询）：

```
① POST /api/v1/services/audio/tts/customization (JSON, base64 音频 + preferred_name) → 获取 voice_id + 试听音频 URL
② POST /api/v1/services/aigc/multimodal-generation/generation (JSON, voice + text) → 返回音频 URL 或 base64
```

模型：voice enrollment 用 `qwen-voice-enrollment`，TTS 用 `qwen3-tts-vc-2026-01-22`。

## 数据库

单表 `cloned_voices`，SQLite 文件位于 `./data/voice-clone.db`（WAL 模式）。

关键字段：`voice_id`（百炼返回的唯一标识）、`status`（pending/completed/failed）、`demo_audio_url`（试听音频）。

迁移文件位于 `./drizzle/`，配置 `drizzle.config.ts`。

## 关键文件

| 文件 | 职责 |
|------|------|
| `src/lib/dashscope.ts` | 百炼 API 客户端（voice enrollment + TTS），参数 camelCase |
| `src/lib/audio-helpers.ts` | 音频持久化，支持 URL/base64/Buffer → `public/tts_output/` |
| `src/lib/api-helpers.ts` | `handleApiError()` 统一错误处理，`validateRequired()` 参数校验 |
| `src/db/queries.ts` | 数据库 CRUD 操作（createVoice, updateVoiceOnComplete/Fail 等） |
| `src/db/schema.ts` | Drizzle ORM schema，单表 `cloned_voices` |

## 注意事项 / 陷阱

- **音色名清洗**：`dashscope.ts` 的 `voiceClone()` 会将中文音色名转为拼音空串，此时自动生成随机 fallback 名（`vc{m7x4k}` 格式）。这是百炼 API 要求（≤10 个小写字母数字）。
- **TTS 响应格式**：`multimodal-generation/generation` 端点返回格式不确定，`extractAudioBuffer()` 按优先级尝试 5 种格式：`choices[].message.content[].audio` → `output.audio.url` → `output.audio.data` → `output.audio` 字符串 → 根级 `audio_url`。调试时可以查看实际返回的 JSON 结构。
- **音量范围**：前端滑块 0~100（百炼格式），不是分贝。默认值 50。
- **API 端点差异**：voice enrollment 用 `/services/audio/tts/customization`，TTS 用 `/services/aigc/multimodal-generation/generation`。注意不是同一个路径前缀。

## 项目约定

- 路径别名：`@/*` → `./src/*`（shadcn/ui 自动配置）
- API 路由统一使用 `handleApiError()` 处理错误，支持 `DashScopeError` 类型
- 无需性能优化。单用户、本地部署、小型音频文件（3-10 秒）。
- `DASHSCOPE_API_KEY` 在 `.env.local` 中配置（已加入 .gitignore）
- `DATABASE_PATH` 可选，默认 `./data/voice-clone.db`
