# 智谱 AI 开放平台 API 参考文档

> 来源: https://docs.bigmodel.cn | 最后更新: 2026-05-08

---

## 1. 概述

智谱 AI 提供 GLM-TTS 系列语音模型，支持**音色复刻（声音克隆）**和**文本转语音（TTS）**功能。

### 核心能力

| 能力 | 说明 |
|------|------|
| 🎤 音色复刻 (GLM-TTS-Clone) | 上传 3-10 秒音频，克隆任意声音 |
| 🎵 文本转语音 (CogTTS / GLM-TTS) | 使用克隆音色或预设音色合成语音 |

### 音色复刻流程

```
① 上传参考音频 (POST /files) → 获取 file_id
② 调用音色复刻 (POST /voice/clone) → 获取 voice_id + 试听音频
③ 使用 TTS (POST /audio/speech) + voice_id → 生成任意语音
```

---

## 2. 快速接入

### 2.1 API 基础信息

| 项目 | 值 |
|------|-----|
| **Base URL** | `https://open.bigmodel.cn/api/paas/v4` |
| **Content-Type** | `application/json` |
| **认证方式** | Bearer Token |

### 2.2 鉴权方式

所有 API 请求必须在 HTTP Header 中携带：

```
Authorization: Bearer {YOUR_API_KEY}
```

API Key 获取地址：https://open.bigmodel.cn/ （控制台 → API 密钥）

---

## 3. 文件上传 API

### 3.1 POST /files — 上传文件

```
POST https://open.bigmodel.cn/api/paas/v4/files
Content-Type: multipart/form-data
Authorization: Bearer {API_KEY}
```

**请求参数（multipart/form-data）：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 要上传的文件 |
| `purpose` | string | 是 | 文件用途：`fine-tune` / `file-extract` |

> ⚠️ 音色复刻使用 `purpose: "file-extract"`，支持 wav/mp3 等音频格式。

**响应格式：**

```json
{
  "id": "file_abc123def456ghi789",
  "object": "file",
  "bytes": 12345,
  "created_at": 1700000000,
  "filename": "audio.wav",
  "purpose": "file-extract"
}
```

---

## 4. 音色复刻 API

### 4.1 POST /voice/clone — 音色复刻

```
POST https://open.bigmodel.cn/api/paas/v4/voice/clone
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

**请求体参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `model` | string | 是 | 固定为 `"glm-tts-clone"` |
| `voice_name` | string | 是 | 自定义音色名称 |
| `text` | string | 是 | 参考音频对应的文本内容（帮助对齐） |
| `input` | string | 是 | 试听文本，用于生成试听音频 |
| `file_id` | string | 是 | 已上传的参考音频文件 ID |
| `request_id` | string | 否 | 请求唯一标识 |

**cURL 示例：**

```bash
curl -X POST "https://open.bigmodel.cn/api/paas/v4/voice/clone" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-tts-clone",
    "voice_name": "我的声音",
    "text": "你好这是一段参考音频的文本内容",
    "input": "欢迎使用智谱AI音色复刻服务",
    "file_id": "file_abc123def456ghi789",
    "request_id": "clone_req_001"
  }'
```

**响应格式：**

```json
{
  "voice_id": "voice_xxx",
  "audio_url": "https://...",
  "request_id": "clone_req_001"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `voice_id` | string | 克隆生成的音色 ID（用于后续 TTS） |
| `audio_url` | string | 试听音频 URL（可选） |
| `request_id` | string | 请求标识 |

---

## 5. 文本转语音 API

### 5.1 POST /audio/speech — 文本转语音

```
POST https://open.bigmodel.cn/api/paas/v4/audio/speech
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

**请求体参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `model` | string | 是 | `"cogtts"` 或 `"glm-tts"` |
| `input` | string | 是 | 待合成文本（UTF-8） |
| `voice` | string | 是 | 音色 ID（来自 voice/clone）或预设音色名 |
| `response_format` | string | 否 | 输出格式：`"wav"` / `"mp3"` |
| `speed` | float | 否 | 语速 0.25~4.0（默认 1.0） |
| `volume` | float | 否 | 音量增益 -10dB~+10dB（默认 0） |

**cURL 示例：**

```bash
curl -X POST "https://open.bigmodel.cn/api/paas/v4/audio/speech" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cogtts",
    "input": "你好，欢迎使用文本转语音功能。",
    "voice": "tongtong"
  }' --output output.wav
```

**响应格式：**
- Content-Type: `audio/wav` 或 `audio/mpeg`
- 返回体：音频文件的**二进制数据**
- 不返回 JSON，直接是音频流

---

## 6. 预设音色列表

| voice 值 | 中文名 | 描述 |
|----------|--------|------|
| `tongtong` | 彤彤 | 女声，温柔自然（默认） |
| `chuichui` | 锤锤 | 男声，沉稳大气 |
| `xiaochen` | 小陈 | 男声，年轻活力 |
| `xiaoxiao` | 小小 | 女声，活泼可爱 |
| `xiaomo` | 小墨 | 男声，沉稳磁性 |
| `xiaobei` | 小贝 | 女声，知性优雅 |
| `xiaoxuan` | 小轩 | 男声，阳光帅气 |

> 使用来自 `/voice/clone` 的 `voice_id` 可获得克隆后的自定义音色。

---

## 7. 错误码

智谱 API 使用标准 HTTP 状态码 + JSON 错误体：

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "无效的 API Key"
  }
}
```

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | API Key 无效或未提供 |
| 429 | 请求频率超限 |
| 500 | 服务器内部错误 |

---

## 8. 其他文件相关接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/files` | 查询文件列表 |
| GET | `/files/{file_id}/content` | 获取文件内容 |
| DELETE | `/files/{file_id}` | 删除文件 |

---

## 9. 重要文档链接

| 文档 | 链接 |
|------|------|
| 智谱AI开放平台 | https://open.bigmodel.cn/ |
| API 文档首页 | https://docs.bigmodel.cn/ |
| GLM-TTS-Clone 指南 | https://docs.bigmodel.cn/cn/guide/models/sound-and-video/glm-tts-clone |
| GLM-TTS 指南 | https://docs.bigmodel.cn/cn/guide/models/sound-and-video/glm-tts |
| 使用概述 | https://docs.bigmodel.cn/cn/api/introduction |
| GitHub 开源 | https://github.com/zai-org/GLM-TTS |
