# 🎙️ Claude Code + DeepSeek 双剑合璧：一个周末，从零到上线 AI 声音克隆网站

> 一个人 + 两个 AI，能不能从零交付带认证系统、API 对接、数据库、安全防护的生产级全栈应用？答案是：能，而且很快。

---

## 📌 为什么要写这篇文章

AI 编程工具大爆发，但我一直好奇：**用 AI 编程，能不能交付一个真正能用的、有用户系统、有安全防护、对接第三方 API 的完整项目？**

于是我给自己定了挑战：一个周末，用 **Claude Code + DeepSeek** 从零搭建一个 AI 声音克隆网站。结果超出预期——项目包含完整的用户认证、数据库设计、频率限制、安全防护、文件管理。这篇文章复盘：**AI 做了什么，我做了什么，踩过哪些坑。**

---

## 🎯 项目目标：AI 声音克隆网站

核心功能四个：

| 功能 | 说明 |
|------|------|
| 🎤 **音色复刻** | 上传 3-300 秒音频 → 30 秒生成专属音色 |
| 🔊 **文本转语音** | 选音色 + 输入文字 → 合成高质量语音 |
| 📚 **音色库** | 已克隆 + 7 个预设音色（Cherry🌸、Ethan☀️、北京话🎧...） |
| 📊 **工作台** | 克隆次数、成功率、今日合成数、最近活动 |

技术选型：**Next.js 16 + TypeScript + Tailwind CSS v4 + SQLite + 阿里云百炼 DashScope API**。

---

## 🤖 我的 AI 开发工作流：Claude Code + DeepSeek 怎么搭配

工具组合：

| 工具 | 角色 | 擅长 |
|------|------|------|
| 🧠 **Claude Code** | 编程智能体 | 代码生成、文件操作、Git、终端 |
| 🔮 **DeepSeek** | 推理引擎 | 长上下文推理、根因分析 |
| 👤 **我** | 架构师+审核 | 技术决策、安全审计 |

### 工作流是这样：

```
我描述需求 → Claude Code 拆解任务 → DeepSeek 推理生成
    → Claude Code 写入文件 → 我审查 → 反馈修正
```

**举个例子——实现百炼 API 客户端：** 我把文档丢给 Claude Code → 生成 `dashscope.ts` → 调试时发现 TTS 返回 5 种 JSON 格式 → DeepSeek 逐一分析提取路径 → Claude Code 写兼容逻辑，一网打尽。

**再比如数据库：** 我描述需求 → DeepSeek 推理表结构 → Claude Code 生成 Drizzle schema + CRUD → 我审查并修正了 datetime 默认值 Bug（后面细说）。

> 🎯 **核心分工：DeepSeek 负责「想清楚」，Claude Code 负责「做出来」，我负责「审对错」。**

---

## 📐 项目架构：AI 辅助下的设计决策

```
浏览器 ──→ Next.js App Router
              ├── middleware.ts ────→ 认证 + 安全头注入
              ├── (auth)/login, register      ← 公开页面
              ├── (dashboard)/                ← 受保护页面
              │     ├── page.tsx               工作台（Server Component 直接查DB）
              │     ├── clone/page.tsx         拖拽上传 → 复刻
              │     ├── tts/page.tsx           文本 → 语音
              │     └── library/page.tsx       音色库管理
              ├── POST /api/voices/clone  ──→ SQLite ──→ 百炼
              ├── POST /api/tts            ──→ 百炼 → 安全目录
              └── POST /api/auth/*         ──→ 用户系统
```

几个 AI 辅助做的关键决策：

**① 工作台直接查库，不绕 HTTP。** Server Component 本身在服务端，不需要 `fetch('/api/stats')` 绕一圈。`Promise.all` 并行查 DB，一个往返搞定。

**② 音色混合列表。** 第 1 页返回「7 个预设 + 用户克隆」，后续仅克隆。通过 `source` 字段区分，预设音色自动隐藏删除按钮。

**③ 文件安全存储。** DeepSeek 提醒生成音频不能放 `public/`，Claude Code 实现 `/api/files/` 鉴权 + 路径遍历防护。

---

## 🔄 百炼 API 对接：AI 写代码，人踩坑

两个核心接口，音色复刻是**同步**的（不用轮询）：

- **音色注册**：`POST /services/audio/tts/customization` → 上传 base64 音频 → 返回 `voice_id`
- **文本合成**：`POST /services/aigc/multimodal-generation/generation` → 返回音频 Buffer

Claude Code 生成 `DashScope` 类，封装认证、请求、错误处理、音频提取。

### ⚠️ 踩坑一：TTS 响应有 5 种格式

这是 AI 帮不了的地方——百炼的合成端点，音频可能藏在 **5 种不同位置** 😅：

1. `output.choices[0].message.content[].audio`
2. `output.audio.url`
3. `output.audio.data`
4. `output.audio` 本身就是 base64
5. 根级别 `audio_url`

DeepSeek 分析每种格式的 JSON 特征，Claude Code 写了按优先级逐一尝试的 `extractAudioBuffer()`。**人和 AI 配合的典型场景：人识别业务异常，AI 生成兼容方案。**

### ⚠️ 踩坑二：中文音色名

百炼要求 ≤10 个小写字母数字。用户输入中文名清洗后是空串 😱。Claude Code 方案：转拼音失败则生成 `vc{m7x4k}` 随机名。

---

## 🔐 安全防护：AI 不会主动考虑，但人必须要求

这是我想强调的重点——**AI 编程工具默认不会主动加安全防护，需要你明确要求。**

| 层 | 措施 | 谁提出 |
|---|------|--------|
| 🔑 密码 | bcryptjs 12轮哈希 | 我 |
| 🍪 会话 | HTTP-only Cookie + SameSite=Lax | 我 |
| ⏱️ 频率限制 | 登录5次/5分钟、TTS 10次/分钟 | 我 |
| 📁 文件 | 鉴权访问 + 路径遍历防护 | DeepSeek |
| 🧱 安全头 | X-Content-Type-Options 等 | Claude Code |

认证流程：

```
注册 → bcryptjs(12轮) 哈希 → users 表
登录 → crypto.randomBytes(32) 生成 token
     → sessions 表(7天过期) → Cookie: HttpOnly; SameSite=Lax
中间件 → 检查 cookie → 公开路由放行 / 其余拦截
```

---

## 📦 数据库：4 张表 + 一个隐蔽的 Bug

Drizzle ORM + SQLite，Claude Code 生成的 4 张表：`users`（用户）、`sessions`（会话，7天过期）、`activities`（活动记录，type: clone/tts/delete/login/register）、`cloned_voices`（音色，voice_id 唯一）。

### ⚠️ 踩坑三：Drizzle 的 datetime 默认值

这是整个项目最隐蔽的 Bug，也是 AI 埋的雷 💣。Claude Code 初始生成的 schema：

```typescript
created_at: text("created_at").notNull().default("(datetime('now'))")
```

看起来没问题对吧？Drizzle 会把 `"(datetime('now'))"` 当作**字符串字面量**加单引号存进去——导致所有行的 `created_at` 字段存的不是时间，而是字符串 `(datetime('now'))` 😱。

**正确写法：**

```typescript
created_at: text("created_at").notNull().default(sql`(datetime('now'))`)
```

必须用 `sql` 模板传表达式。insert 时显式传 `new Date().toISOString()` 最稳妥。**AI 生成的 ORM 代码一定要检查 SQL 转义。**

---

## 🎨 UI 主题：从紫色到 Readdy 中性深色

一开始 Claude Code 生成的是紫色主题。我觉得太「花哨」，让它改成 **Readdy 极简中性深色**：暖灰调背景、中性灰白主色、shadcn/ui v4 组件。Claude Code 一次性全局迁移所有 CSS 变量和组件样式。**这种大规模重构交给 AI 简直是降维打击。**

---

## 🧠 Claude Code + DeepSeek 实战心得

经过这个项目，我对 AI 编程的边界有了清晰认知：

### ✅ 放心交给 AI
- **样板代码**：API 路由、表单组件、CRUD——描述需求，秒出代码
- **大规模重构**：主题迁移、响应格式兼容——改几十个文件一句话的事
- **参考实现**：丢 API 文档链接，AI 自动封装客户端

### ⚠️ 必须人把关
- **架构决策**：SQLite 还是 PostgreSQL？AI 只能列优缺点，不能做判断
- **隐蔽 Bug**：Drizzle datetime 坑，AI 不仅没发现，还是它自己写的
- **安全审计**：AI 不会主动加路径遍历防护，除非你明确要求

### 🔮 DeepSeek 的独特价值

DeepSeek 最大优势是**长上下文推理**——当代码出问题时，它能跨多文件分析根因。datetime Bug 就是 DeepSeek 定位到 Drizzle 的 SQL 转义机制。

> **Claude Code 是手，DeepSeek 是脑，人是眼睛。三者缺一不可。**

---

## 🏁 5 条命令跑起来

```bash
git clone git@github.com:snow-sakura/voice-clone.git
cd voice-clone && npm install
echo "DASHSCOPE_API_KEY=sk-你的密钥" > .env.local
npx drizzle-kit push
npm run dev  # → http://localhost:3000
```

---

## 💡 写在最后

完整项目已开源 👉 [snow-sakura/voice-clone](https://github.com/snow-sakura/voice-clone)

这次实验验证了：**2026 年的 AI 编程工具，已经可以交付生产级全栈应用。** 不是「一句话生成」的魔法——需要清晰的需求定义、对 AI 输出保持审视、建立高效的人机协作。

**Claude Code + DeepSeek 这个组合，一个周末完成过去至少两周的工作量。** 这不是替代，是倍增。

欢迎 Star ⭐ 和交流讨论！

> 🎤 **AI 让每个人都能复刻自己的声音。Claude + DeepSeek，让开发者复刻自己的想象力。**

---

*Claude Code × DeepSeek · Next.js 16 · TypeScript · Tailwind CSS v4 · SQLite · 阿里云百炼 DashScope*
