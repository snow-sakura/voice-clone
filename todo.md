# 声音克隆网站 — 待办任务

---

## 迁移：闪剪 AI → 智谱 AI

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

---

## 代码审查修复

- [x] 5.1 修复 TTS 页音量范围 0-100 → -10~+10 dB
- [x] 5.2 修复声音克隆页「试听文本」标签错误标记为选填
- [x] 5.3 修复 DELETE API 删除不存在的音色仍返回成功（新增 404）
- [x] 5.4 移除只有一个选项的模型下拉框（死 UI）
- [x] 5.5 新增服务端文件类型和大小校验
- [x] 5.6 `readFileSync` → `readFile`（异步文件读取）
- [x] 5.7 修复拖拽高亮闪烁（`relatedTarget` 判断）
- [x] 5.8 文件选择后不自动提交，改为手动点击按钮

---
