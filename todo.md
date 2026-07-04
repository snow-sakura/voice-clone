# 声音克隆网站 — 待办任务

---

## ✅ 已完成任务

### 迁移：闪剪 AI → 智谱 AI

- [x] 4.1 创建 `src/lib/zhipu.ts` — 智谱 AI API 客户端
- [x] 4.2 更新数据库 Schema 和 Queries（speaker_id → voice_id）
- [x] 4.3 更新 `.env.local` 环境变量（ZHIPU_API_KEY）
- [x] 4.4 重写 `POST /api/voices/clone` — 文件上传 + 音色复刻流程
- [x] 4.5 删除 `GET /api/voices/clone/[taskId]` — 不再需要任务轮询
- [x] 4.6 更新 `GET /api/voices` — 适配 voice_id（无需修改，自动适配）
- [x] 4.7 更新 `DELETE /api/voices/[id]` — 适配 voice_id
- [x] 4.8 更新 `GET /api/voices/public` — 返回预设音色列表
- [x] 4.9 重写 `POST /api/tts` — 处理二进制音频响应
- [x] 4.10 更新声音克隆页 — 新增音频文案输入，去掉轮询
- [x] 4.11 更新 TTS 页 — 适配 voice_id
- [x] 4.12 运行数据库迁移
- [x] 4.13 清理旧的闪剪 AI 代码

### 代码审查修复

- [x] 5.1 修复 TTS 页音量范围 0-100 → -10~+10 dB
- [x] 5.2 修复声音克隆页「试听文本」标签错误标记为选填
- [x] 5.3 修复 DELETE API 删除不存在的音色仍返回成功（新增 404）
- [x] 5.4 移除只有一个选项的模型下拉框（死 UI）
- [x] 5.5 新增服务端文件类型和大小校验
- [x] 5.6 `readFileSync` → `readFile`（异步文件读取）
- [x] 5.7 修复拖拽高亮闪烁（`relatedTarget` 判断）
- [x] 5.8 文件选择后不自动提交，改为手动点击按钮

### 迁移：智谱 AI → 阿里云百炼 DashScope

- [x] 6.1 更新 `.env.local` — ZHIPU_API_KEY → DASHSCOPE_API_KEY
- [x] 6.2 创建 `src/lib/dashscope.ts` — DashScope API 客户端（voice enrollment + TTS）
- [x] 6.3 更新 `src/lib/api-helpers.ts` — ZhipuError → DashScopeError
- [x] 6.4 更新 DB schema — 默认 model 改为 qwen-voice-enrollment
- [x] 6.5 重写 `POST /api/voices/clone` — base64 音频直传百炼
- [x] 6.6 重写 `POST /api/tts` — multimodal-generation 端点
- [x] 6.7 更新 `GET /api/voices/public` — 百炼系统音色列表
- [x] 6.8 更新前端页面 — 移除智谱引用，rename zhipuVoiceId → apiVoiceId
- [x] 6.9 删除 `src/lib/zhipu.ts` 和旧文档
- [x] 6.10 更新 CLAUDE.md — 技术栈和架构文档
- [x] 6.11 TypeScript 类型检查通过（零错误）

### 文档更新

- [x] 7.1 更新 README.md — 补充 API 路由、环境变量、部署说明、故障排除、贡献指南
- [x] 7.2 更新 AGENTS.md — 添加完整的项目代理规则和开发指导
- [x] 7.3 更新 todo.md — 清理已完成任务，归档历史记录

---

## 📝 未来改进方向

### 功能增强

- [ ] 支持音频格式转换（自动将 MP3/WAV 转换为合适的格式）
- [ ] 添加音频剪辑功能（截取 3-10 秒片段）
- [ ] 支持批量 TTS 合成
- [ ] 添加音色分享功能（生成分享链接）
- [ ] 支持多语言文本转语音
- [ ] 添加音频下载功能（支持多种格式）

### 性能优化

- [ ] 添加缓存机制（缓存 TTS 结果）
- [ ] 支持流式 TTS（边生成边播放）
- [ ] 添加 CDN 加速音频文件访问

### 用户体验

- [ ] 添加音频波形可视化
- [ ] 支持快捷键操作
- [ ] 添加深色/浅色主题切换
- [ ] 支持移动端适配优化
- [ ] 添加操作提示和引导

### 安全增强

- [ ] 添加 CSRF 防护
- [ ] 添加 OAuth 第三方登录（GitHub/Google）
- [ ] 支持 API Key 轮换
- [ ] 添加审计日志

### 运维支持

- [ ] 添加 Docker Compose 部署配置
- [ ] 添加 PM2 进程管理配置
- [ ] 添加健康检查端点
- [ ] 添加日志系统集成

---

## 📋 开发计划

### 短期（1-2 周）

1. 添加音频波形可视化
2. 支持批量 TTS 合成
3. 添加音频下载功能

### 中期（1-2 个月）

1. 添加缓存机制
2. 支持流式 TTS
3. 添加深色/浅色主题切换

### 长期

1. 添加 OAuth 第三方登录
2. 支持多语言文本转语音
3. 添加音色分享功能