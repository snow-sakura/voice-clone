# 声音克隆网站 — 待办任务

---

## 第一块：安装所有依赖

- [x] 1.1 使用 `create-next-app` 创建 Next.js 项目（TypeScript + App Router + Tailwind CSS）
- [x] 1.2 安装 shadcn/ui 并配置基础组件
- [x] 1.3 安装 Drizzle ORM + better-sqlite3 + 数据库相关依赖
- [x] 1.4 安装其他依赖（sonner 通知、react-dropzone 文件上传等）
- [x] 1.5 配置 `.env.local` 环境变量（SHANJIAN_API_KEY）
- [x] 1.6 创建项目目录结构（lib/ db/ components/ app/）

---

## 第二块：开发后端功能

- [x] 2.1 配置 Drizzle ORM + SQLite 数据库连接
- [x] 2.2 创建 `cloned_voices` 表 Schema 定义
- [x] 2.2+ 创建 `drizzle.config.ts` 配置文件
- [x] 2.3 运行数据库迁移，生成初始表结构
- [x] 2.4 封装数据库操作函数（增删改查 cloned_voices）
- [x] 2.5 封装闪剪 AI API 客户端（`lib/shanjian.ts`）
- [x] 2.6 实现 `POST /api/voices/clone` — 声音克隆接口
- [x] 2.7 实现 `GET /api/voices/clone/[taskId]` — 任务状态查询接口
- [x] 2.8 实现 `GET /api/voices` — 获取已克隆声音列表
- [x] 2.9 实现 `DELETE /api/voices/[id]` — 删除声音
- [x] 2.10 实现 `POST /api/tts` — 文本转语音接口
- [x] 2.11 实现 `GET /api/voices/public` — 公共配音列表代理
- [x] 2.12 添加错误处理和参数校验
- [x] 2.13 处理音频文件上传和本地存储

---

## 第三块：开发网站页面

- [x] 3.1 创建全局 Layout 组件（含顶部导航栏）
- [x] 3.2 实现首页 `/` — 两个功能入口卡片
- [x] 3.3 实现声音克隆页 `/clone` — 音频上传 + 表单 + 任务状态
- [x] 3.4 实现文本转语音页 `/tts` — 文本输入 + 音色选择 + 生成播放

---
