# Fish Audio API 完整参考文档

> 来源: [Fish Audio 官方文档](https://docs.fish.audio) | 最后更新: 2026-05-08

---

## 1. 概述

Fish Audio 是一个 AI 语音平台，提供文本转语音 (TTS)、语音克隆、语音转文本 (ASR) 等功能。支持 80+ 种语言，具有情感控制和实时流式传输能力。

- **官方网站**: https://fish.audio
- **API 基础 URL**: `https://api.fish.audio`
- **控制台**: https://fish.audio/app/api-keys/

---

## 2. 快速开始

### 2.1 注册账号

1. 访问 [fish.audio/auth/signup](https://fish.audio/auth/signup)
2. 填写信息创建账号，完成验证
3. 登录后进入 [API Keys 页面](https://fish.audio/app/api-keys)

### 2.2 获取 API Key

1. 登录 [Fish Audio 控制台](https://fish.audio/app/api-keys/)
2. 进入 API Keys 区域
3. 点击 "Create New Key"，命名并设置过期时间
4. **立即复制并安全保存 Key**

> ⚠️ **警告**: 绝对不要将 API Key 提交到版本控制系统或公开分享！

### 2.3 认证方式

所有 API 请求需在 Header 中携带 Bearer Token：

```
Authorization: Bearer YOUR_API_KEY
```

---

## 3. SDK 安装

### Python SDK

```bash
# 基础安装 (Python 3.9+)
pip install fish-audio-sdk

# 包含音频播放工具
pip install fish-audio-sdk[utils]
```

初始化客户端（自动从环境变量 `FISH_API_KEY` 读取）：

```python
from fishaudio import FishAudio

client = FishAudio()  # 从 FISH_API_KEY 环境变量读取
# 或显式传入
client = FishAudio(api_key="your_api_key")
```

**异步客户端：**

```python
from fishaudio import AsyncFishAudio

client = AsyncFishAudio(api_key="your_api_key")
```

**配置参数：**

```python
FishAudio(
    api_key="...",                    # API Key
    base_url="https://api.fish.audio",  # 默认 API 地址
    timeout=240.0                     # 请求超时（秒）
)
```

### JavaScript/TypeScript SDK

```bash
npm install fish-audio
```

初始化客户端：

```typescript
import { FishAudioClient } from "fish-audio";

const client = new FishAudioClient({
    apiKey: "your_api_key",
    baseUrl: "https://api.fish.audio"  // 可选，支持代理
});
```

> 支持环境: Node.js, Deno, Bun（仅限服务端环境）

---

## 4. 文本转语音 (TTS) API

### 4.1 直接 REST API 调用

#### POST /tts — 语音合成（单句/多说话人）

```
POST https://api.fish.audio/tts
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**请求体：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 要合成的文本。多说话人用 `<\|speaker:n\|>` 标签 |
| `reference_id` | string/array | 否 | 声音模型 ID。单说话人为字符串，多说话人为数组 |
| `temperature` | number | 否 | 表现力控制 (0-1)，默认 0.7 |
| `top_p` | number | 否 | 核采样多样性 (0-1)，默认 0.7 |
| `references` | array | 否 | 内联参考音频（即时克隆，需 MessagePack） |

**示例 - 单说话人：**

```json
{
  "text": "你好，欢迎使用 Fish Audio！",
  "reference_id": "your_model_id"
}
```

**示例 - 多说话人对话 (S2-Pro)：**

```json
{
  "text": "<|speaker:0|>早上好！<|speaker:1|>早上好！你好吗？",
  "reference_id": ["model-id-alice", "model-id-bob"]
}
```

#### POST /tts/stream — 流式语音合成

```
POST https://api.fish.audio/tts/stream
```

**请求体参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 要合成的文本 |
| `reference_id` | string | 否 | 声音参考 ID |
| `references` | list[ReferenceAudio] | 否 | 参考音频样本 |
| `format` | string | 否 | 音频格式："mp3", "wav", "pcm", "opus" |
| `latency` | string | 否 | 延迟模式："normal"（高质量）或 "balanced"（快速） |
| `speed` | float | 否 | 语速倍率（如 1.5 = 1.5倍速） |
| `config` | TTSConfig | 否 | TTS 配置对象 |
| `model` | string | 否 | 模型："s2-pro"（默认） |

**Python 示例：**

```python
# 逐块处理
for chunk in client.tts.stream(text="Hello world"):
    process_audio_chunk(chunk)

# 一次性收集
audio = client.tts.stream(text="Hello world").collect()
```

#### POST /tts/convert — 一次性完整合成

```
POST https://api.fish.audio/tts/convert
```

参数与 `/tts/stream` 相同，但返回完整音频字节。

**Python 示例：**

```python
from fishaudio.utils import play, save

# 获取完整音频
audio = client.tts.convert(text="Hello world")

# 播放
play(audio)

# 保存
save(audio, "output.mp3")
```

### 4.2 WebSocket 实时流式传输

#### WebSocket /v1/tts/live

```
wss://api.fish.audio/v1/tts/live
```

**连接参数：**
- `Authorization: Bearer <api_key>` — 认证
- `model` — TTS 模型 (`s1` 或 `s2-pro`)

**协议：** MessagePack (`application/msgpack`)

**Python 示例：**

```python
from fishaudio import FishAudio

client = FishAudio()

# 流式文本生成（适合 LLM 集成）
def text_chunks():
    yield "Hello, "
    yield "this is "
    yield "streaming text!"

audio_stream = client.tts.stream_websocket(
    text_chunks(),
    reference_id="your_model_id",
    temperature=0.7,
    top_p=0.7,
    latency="balanced"
)

with open("output.mp3", "wb") as f:
    for audio_chunk in audio_stream:
        f.write(audio_chunk)
```

**WebSocket 选项（长文本生成）：**

```python
from fishaudio import WebSocketOptions

ws_options = WebSocketOptions(keepalive_ping_timeout_seconds=60.0)
async for audio_chunk in client.tts.stream_websocket(
    text_generator(),
    ws_options=ws_options
):
    await f.write(audio_chunk)
```

### 4.3 TTSConfig 完整参数

```python
from fishaudio.types import TTSConfig, Prosody

config = TTSConfig(
    # === 音频输出设置 ===
    format="mp3",               # "mp3", "wav", "pcm", "opus"
    sample_rate=44100,          # 采样率 (Hz)，None = 格式默认
    mp3_bitrate=128,            # MP3 比特率: 64, 128, 192 kbps
    opus_bitrate=32,            # Opus 比特率: -1000, 24, 32, 48, 64
    normalize=True,             # 是否规范化/清理输入文本

    # === 生成设置 ===
    chunk_length=200,           # 每块字符数 (100-300)。低=快速响应，高=更好质量
    min_chunk_length=50,        # 最小块长度
    latency="balanced",         # "normal" (高质量) 或 "balanced" (低延迟)
    condition_on_previous_chunks=True,

    # === 声音/风格设置 ===
    reference_id="model_id",    # 声音模型 ID
    references=[],              # 即时克隆参考音频列表
    prosody=Prosody(
        speed=1.0,              # 语速 (1.0=正常)
        volume=0                # 音量 (-20 到 +20)
    ),

    # === 模型参数 ===
    temperature=0.7,            # 随机性 (0.0-1.0)，越高越多样
    top_p=0.7,                  # 核采样 (0.0-1.0)
    max_new_tokens=1024,        # 最大生成长度
    repetition_penalty=1.2,    # 重复惩罚
    early_stop_threshold=1.0,
)
```

### 4.4 音频格式

| 格式 | 后缀 | 说明 | 可配置项 |
|------|------|------|---------|
| MP3 | `.mp3` | 默认格式，有损压缩 | `mp3_bitrate`: 64/128/192 kbps |
| WAV | `.wav` | 无损未压缩 | `sample_rate` |
| Opus | `.opus` | 高效流式格式 | `opus_bitrate`: -1000/24/32/48/64 |
| PCM | `.pcm` | 原始音频数据 | `sample_rate` |

---

## 5. 声音模型 API

### 5.1 POST /model — 创建声音模型

```
POST https://api.fish.audio/model
Content-Type: multipart/form-data
Authorization: Bearer YOUR_API_KEY
```

**请求参数（multipart/form-data）：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `voices` | File[] | 是 | 音频样本 (.mp3, .wav) |
| `title` | string | 是 | 模型名称 |
| `description` | string | 否 | 模型描述 |
| `visibility` | string | 否 | 可见性: `private`, `public`, `unlist` (默认 public) |
| `type` | string | 是 | 模型类型，必须为 `tts` |
| `train_mode` | string | 是 | 训练模式：`fast`（即时可用）或 `full` |
| `enhance_audio_quality` | boolean | 否 | 是否增强音频质量（去除背景噪音） |
| `texts` | string[] | 否 | 对应音频文件的文本转录 |
| `cover_image` | File | 否 | 封面图片（public 时必需） |
| `tags` | string[] | 否 | 标签 |

**Python REST API 示例：**

```python
import requests

response = requests.post(
    "https://api.fish.audio/model",
    files=[
        ("voices", open("sample1.mp3", "rb")),
        ("voices", open("sample2.wav", "rb"))
    ],
    data=[
        ("title", "My Voice Model"),
        ("description", "Custom voice model"),
        ("visibility", "private"),
        ("type", "tts"),
        ("train_mode", "fast"),
        ("enhance_audio_quality", "true")
    ],
    headers={"Authorization": "Bearer YOUR_API_KEY"}
)

result = response.json()
print(f"Model ID: {result['_id']}")
```

**Python SDK 示例：**

```python
from fish_audio_sdk import Session

session = Session("your_api_key")
model = session.create_model(
    title="My Voice Model",
    description="Custom voice for storytelling",
    voices=[voice_file1.read(), voice_file2.read()],
    cover_image=image_file.read()  # 可选
)
print(f"Model created: {model.id}")
```

### 5.2 GET /model — 列出模型

```
GET https://api.fish.audio/model
Authorization: Bearer YOUR_API_KEY
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page_size` | int | 10 | 每页数量 |
| `page_number` | int | 1 | 页码（从1开始） |
| `title` | string | — | 按标题过滤 |
| `tag` | array/string | — | 按标签过滤 |
| `self` | boolean | false | 仅返回自己创建的模型 |
| `author_id` | string | — | 按作者 ID 过滤 |
| `language` | array/string | — | 按语言过滤 |
| `title_language` | array/string | — | 按标题语言过滤 |
| `sort_by` | string | score | 排序：`score`, `task_count`, `created_at` |

**响应：**

```json
{
  "total": 100,
  "items": [
    {
      "_id": "voice_id_1",
      "title": "Example Voice",
      "description": "A sample voice model.",
      "tags": ["english", "male"],
      "visibility": "public",
      "state": "trained",
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z"
    }
  ]
}
```

**Python SDK 示例：**

```python
# 列出所有声音
voices = client.voices.list(page_size=20)
print(f"Total: {voices.total}")
for voice in voices.items:
    print(f"{voice.title}: {voice.id}")

# 按标签过滤
tagged = client.voices.list(tags=["male", "english"])

# 仅自己的模型
my_voices = client.voices.list(self_only=True)
```

### 5.3 GET /model/{id} — 获取模型详情

```
GET https://api.fish.audio/model/{id}
Authorization: Bearer YOUR_API_KEY
```

**响应字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 模型唯一标识符 |
| `type` | string | `svc` 或 `tts` |
| `title` | string | 模型标题 |
| `description` | string | 模型描述 |
| `cover_image` | string | 封面图 URL |
| `train_mode` | string | `fast` 或 `full` |
| `state` | string | `created`, `training`, `trained`, `failed` |
| `tags` | string[] | 标签列表 |
| `visibility` | string | `public`, `unlist`, `private` |
| `languages` | string[] | 支持的语言 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |
| `like_count` | int | 点赞数 |
| `mark_count` | int | 收藏数 |
| `shared_count` | int | 分享数 |
| `author` | object | 作者信息 |

### 5.4 DELETE /model/{id} — 删除模型

```
DELETE https://api.fish.audio/model/{id}
Authorization: Bearer YOUR_API_KEY
```

成功返回 200，无权限返回 401。

---

## 6. 语音克隆

### 6.1 两种克隆方式

#### 方式一：reference_id（预训练模型）

使用已创建的声音模型的 ID，适合反复使用同一声音：

```python
audio = client.tts.convert(
    text="This uses a pre-trained voice model",
    reference_id="802e3bc2b27e49c2995d23ef70e6ac89"
)
```

> 模型 ID 可从声音 URL 中找到，或通过 `voices.list()` 获取

#### 方式二：references（即时克隆 / Zero-shot）

无需创建持久化模型，直接传入参考音频：

```python
from fishaudio.types import ReferenceAudio

with open("reference.wav", "rb") as f:
    audio = client.tts.convert(
        text="This will sound like the reference voice",
        references=[ReferenceAudio(
            audio=f.read(),
            text="Text spoken in the reference audio"
        )]
    )
```

**使用多个参考样本提升质量：**

```python
references = []
samples = [
    ("sample1.wav", "First sample transcript"),
    ("sample2.wav", "Second sample transcript"),
    ("sample3.wav", "Third sample transcript")
]

for audio_file, transcript in samples:
    with open(audio_file, "rb") as f:
        references.append(ReferenceAudio(
            audio=f.read(),
            text=transcript
        ))

audio = client.tts.convert(
    text="This voice is trained on multiple samples",
    references=references
)
```

### 6.2 ReferenceAudio 结构

```python
ReferenceAudio(
    audio=bytes,   # 音频文件字节数据
    text=str       # 参考音频的精确文本转录（包含标点以改善韵律）
)
```

### 6.3 模型训练模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `fast` | 即时可用，快速训练 | 快速原型、测试 |
| `full` | 完整训练，更高质量 | 生产环境、精品声音 |

---

## 7. 语音转文本 (ASR) API

### 7.1 POST /v1/asr — 语音识别

```
POST https://api.fish.audio/v1/asr
Authorization: Bearer YOUR_API_KEY
```

**请求体：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `audio` | binary | 是 | 要转录的音频数据 |
| `language` | string/null | 否 | 语言代码（如 `en`），默认自动检测 |
| `ignore_timestamps` | boolean | 否 | 是否跳过时间戳（默认 true） |

**响应：**

```json
{
  "text": "This is the transcribed text.",
  "duration": 10.5,
  "segments": [
    {
      "start": 0.5,
      "end": 2.1,
      "text": "This is the first segment."
    }
  ]
}
```

### 7.2 POST /asr/transcribe — SDK 方式

```python
from fishaudio import FishAudio

client = FishAudio(api_key="...")

with open("audio.mp3", "rb") as f:
    audio_bytes = f.read()

result = client.asr.transcribe(audio=audio_bytes, language="en")
print(result.text)
for segment in result.segments:
    print(f"{segment.start}-{segment.end}: {segment.text}")
```

### 7.3 支持的语言代码

| 代码 | 语言 |
|------|------|
| `en` | 英语 |
| `zh` | 中文 |
| `es` | 西班牙语 |
| `fr` | 法语 |
| `de` | 德语 |
| `ja` | 日语 |
| `ko` | 韩语 |
| `pt` | 葡萄牙语 |

> 自动语言检测效果好，但明确指定语言可提高准确率和速度。

### 7.4 音频限制

- 最大文件大小：20MB
- 最大时长：60 分钟
- 支持格式：MP3, WAV, M4A, OGG, FLAC, AAC

---

## 8. 错误处理

### 8.1 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 未授权 — API Key 无效或缺失 |
| 402 | 需要付费 — 配额不足 |
| 404 | 未找到 — 资源不存在 |
| 422 | 验证错误 — 请求参数无效 |
| 429 | 速率限制 — 请求过于频繁 |

### 8.2 错误响应格式

```json
{
  "status": 401,
  "message": "No permission -- see authorization schemes"
}
```

**422 验证错误详情：**

```json
[
  {
    "loc": ["field_name"],
    "type": "value_error",
    "msg": "error message",
    "ctx": "error context",
    "in": "body"
  }
]
```

### 8.3 Python 异常处理

```python
from fishaudio import FishAudio
from fishaudio.exceptions import (
    FishAudioError,
    AuthenticationError,
    RateLimitError,
    ValidationError
)

client = FishAudio()

try:
    audio = client.tts.convert(text="Hello!")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded. Please wait before retrying.")
except ValidationError as e:
    print(f"Invalid request: {e}")
except FishAudioError as e:
    print(f"API error: {e}")
```

### 8.4 JavaScript 重试示例

```typescript
async function generateWithRetry(request: Record<string, unknown>, maxRetries = 3) {
    const fishAudio = new FishAudioClient();
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fishAudio.textToSpeech.convert(request);
        } catch (e: any) {
            const status = e?.status || e?.response?.status;
            if (status === 429) {
                // 指数退避
                await new Promise(r => setTimeout(r, 2 ** attempt * 1000));
            } else if (status === 401) {
                throw new Error("Invalid API key");
            } else {
                throw e;
            }
        }
    }
}
```

---

## 9. 自托管 (Self-Hosting)

### 9.1 Docker 部署

```bash
# 启动 API 服务器（启用编译优化）
COMPILE=1 docker compose --profile server up
```

### 9.2 环境变量 (.env)

```bash
BACKEND=cuda              # 或 cpu
COMPILE=1                 # 启用编译优化
GRADIO_PORT=7860         # WebUI 端口
API_PORT=8080            # API 服务器端口
UV_VERSION=0.8.15        # UV 包管理器版本
```

### 9.3 本地 API 调用

自托管后，API 端点为 `http://localhost:8080/v1/tts`：

```bash
curl -X POST "http://localhost:8080/v1/tts" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test",
    "reference_audio": "base64_encoded_audio",
    "reference_text": "Reference transcription"
  }'
```

---

## 10. 可用模型

| 模型 | 说明 |
|------|------|
| `s1` | 基础 TTS 模型 |
| `s2-pro` | 高级模型，支持多说话人对话合成（默认推荐） |

---

## 11. 最佳实践

- **API Key 安全**: 使用环境变量 `FISH_API_KEY` 存储密钥，不要硬编码
- **流式传输**: 对于长文本或实时场景，优先使用 WebSocket `/v1/tts/live`
- **即时克隆 vs 模型**: 一次性使用用 `references`，反复使用用 `reference_id`
- **语言指定**: ASR 中明确指定语言可提高准确率
- **错误重试**: 对 429 错误实施指数退避重试
- **音频格式**: 流式场景推荐 Opus，高质量场景用 WAV，通用场景用 MP3

---

## 12. 相关链接

| 资源 | URL |
|------|-----|
| 官方网站 | https://fish.audio |
| API 文档 | https://docs.fish.audio |
| 开发者指南 | https://docs.fish.audio/developer-guide/getting-started/introduction |
| API 参考 | https://docs.fish.audio/api-reference/introduction |
| API 控制台 | https://fish.audio/app/api-keys/ |
| 注册账号 | https://fish.audio/auth/signup |
