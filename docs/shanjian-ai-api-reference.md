# 闪剪 AI 开放平台 API 完整参考文档

> 来源: [闪剪AI开放平台官方文档](https://openapi-doc.shanjian.tv/) | 最后更新: 2026-05-08

---

## 1. 概述

闪剪 AI 开放平台是一站式视频智能创作平台，由深圳市趣推科技有限公司开发运营。为个人/企业开发者提供**数字人克隆、声音克隆、智能剪辑、裸视频合成**等 AI 能力。

### 核心能力

| 能力 | 说明 |
|------|------|
| 🎤 声音克隆 | 上传 5-120 秒音频，克隆任意声音，支持 40+ 语种 |
| 👤 数字人克隆 | 真人形象克隆，支持专业/极速/图生模式 |
| 🎵 文本转语音 (TTS) | 通过克隆的音色或公共配音合成语音 |
| 📝 语音转文字 (ASR) | 音频/视频转文字，支持时间戳 |
| 🎬 视频合成 | 数字人/真人口播、混剪、智能剪辑模板 |
| 🖼️ AI 封面 | AI 生成视频封面图 |

### 声音克隆模型版本

| 版本 | 音频时长 | 特点 | 支持语种 |
|------|---------|------|---------|
| **V1** | 5~120秒 | 声音还原度高，质感好，对原音频包容度高 | 基础语种 |
| **V2** | 5~120秒 | 音色更清晰，表现力更强，情感丰富 | 基础语种 |
| **V3** | 5~120秒 | 音色最还原逼真，长文本/口语化/情感演绎更佳 | 中、英、日、西、印尼、葡 |
| **S1** | 10~120秒 | 支持 40+ 小语种（含粤语） | 40+ 语种 |
| **S3** | 10~120秒 | 最新版声音克隆模型 | — |

> V1-V3 接口支持**免费无限克隆**。

---

## 2. 快速接入

### 2.1 接入流程

```
注册账号 → 实名认证 → 创建API密钥 → 购买资源包 → 调用API
```

1. **注册**: 访问 [闪剪AI控制台](https://dev.shanjian.tv/) 注册账号
2. **实名认证**: 支持个人认证和企业认证（个人认证通常 1 分钟内完成）
3. **创建 API 密钥**: 在控制台左侧「API密钥」菜单，点击「创建API密钥」获取 `appKey`
4. **购买资源包**: 获得 API 调用权限和算力额度

### 2.2 API 基础信息

| 项目 | 值 |
|------|-----|
| **Base URL** | `https://openapi.shanjian.tv` |
| **Content-Type** | `application/json` |
| **认证方式** | Bearer Token |

### 2.3 鉴权方式

所有 API 请求必须在 HTTP Header 中携带：

```
Authorization: Bearer {YOUR_APP_KEY}
```

**cURL 示例：**

```bash
curl -X POST "https://openapi.shanjian.tv/v1/voice/train" \
  -H "Authorization: Bearer YOUR_APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "voice_name": "我的声音",
    "audio_url": "https://example.com/audio.wav",
    "model": "V3"
  }'
```

> ⚠️ **安全警告**: 绝对不要将 API 密钥暴露给前端应用或提交到版本控制系统！

---

## 3. 声音克隆 API

### 3.1 POST /v1/voice/train — 声音克隆

```
POST https://openapi.shanjian.tv/v1/voice/train
Content-Type: application/json
Authorization: Bearer {APP_KEY}
```

**请求体参数（已知）：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `voice_name` | string | — | 声音名称 |
| `audio_url` | string | — | 参考音频 URL（5-120 秒） |
| `model` | string | — | 模型版本：`V1`, `V2`, `V3`, `S1`, `S3` |

> 📖 完整参数请参考官方文档: https://openapi-doc.shanjian.tv/342241374e0

**回调响应（制作类接口通用结构）：**

```json
{
    "taskId": "string",
    "status": "succeed",
    "result": {
        "speakerId": "string",
        "demoAudioUrl": "string"
    },
    "costRights": {
        "credits": 0
    }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `taskId` | string | 任务 ID |
| `status` | string | 任务状态：`succeed` |
| `result.speakerId` | string | 克隆的音色 ID（用于后续 TTS） |
| `result.demoAudioUrl` | string | Demo 音频 URL |
| `costRights.credits` | integer | 消耗的算力 |

### 3.2 POST /v1/virtualman/train — 专业数字人克隆

```
POST https://openapi.shanjian.tv/v1/virtualman/train
Authorization: Bearer {APP_KEY}
```

专业模式数字人克隆，质量最高。

### 3.3 POST /v1/virtualman/fast/train — 极速数字人克隆

```
POST https://openapi.shanjian.tv/v1/virtualman/fast/train
Authorization: Bearer {APP_KEY}
```

快速数字人克隆模式，速度优先。

### 3.4 POST /v1/virtualman/image/train — 图生数字人克隆

```
POST https://openapi.shanjian.tv/v1/virtualman/image/train
Authorization: Bearer {APP_KEY}
```

通过图片生成数字人。

### 3.5 DELETE /v1/assets/{id} — 数字人/声音删除

```
DELETE https://openapi.shanjian.tv/v1/assets/{id}
Authorization: Bearer {APP_KEY}
```

删除已创建的数字人或声音资产。

---

## 4. 文本转语音 (TTS) API

### 4.1 POST /v1/effect/tts — 文本转语音

```
POST https://openapi.shanjian.tv/v1/effect/tts
Content-Type: application/json
Authorization: Bearer {APP_KEY}
```

使用克隆的音色 ID 或公共配音将文本合成为语音。

**预期参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `text` | string | 是 | 待合成的文本内容 |
| `speaker_id` | string | 是 | 音色 ID（来自声音克隆或公共配音列表） |
| `speed` | float | 否 | 语速（如 1.0=正常，1.5=1.5倍速） |
| `volume` | float | 否 | 音量 |
| `format` | string | 否 | 输出音频格式（mp3, wav 等） |

> 📖 完整参数请参考官方文档: https://openapi-doc.shanjian.tv/359919256e0

**TTS 结果回调包含字幕信息：**

```json
{
    "subtitle": [
        {
            "text": "合成的文本",
            "startMs": 0,
            "endMs": 3000
        }
    ]
}
```

### 4.2 GET /v1/assets/voice/common — 公共配音列表

```
GET https://openapi.shanjian.tv/v1/assets/voice/common
Authorization: Bearer {APP_KEY}
```

获取平台提供的公共 AI 配音音色列表，无需训练即可使用。

**支持语种：**
中文、粤语、英语、西班牙语、法语、俄语、德语、葡萄牙语、阿拉伯语、意大利语、日语、韩语、印尼语、越南语、土耳其语、荷兰语、乌克兰语、泰语、波兰语、罗马尼亚语、希腊语、捷克语、芬兰语、印地语、保加利亚语、丹麦语、希伯来语、马来语、波斯语、斯洛伐克语、瑞典语、克罗地亚语、菲律宾语、匈牙利语、挪威语、斯洛文尼亚语、加泰罗尼亚语、泰米尔语等

---

## 5. 语音转文字 (ASR) API

### 5.1 POST /v1/effect/asr — 音频转文字

```
POST https://openapi.shanjian.tv/v1/effect/asr
Content-Type: application/json
Authorization: Bearer {APP_KEY}
```

将音频/视频中的语音识别为文本，支持时间戳。

**请求示例：**

```bash
curl -X POST "https://openapi.shanjian.tv/v1/effect/asr" \
  -H "Authorization: Bearer YOUR_APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.mp3"
  }'
```

**典型应用流程：**

```
上传视频素材 → ASR 语音识别文案 → 修改文案（如修正错别字）
→ 传入混剪接口的 subtitle 字段 → 选择模板包装 → 输出成品
```

---

## 6. 视频合成 API

### 6.1 POST /v1/virtualman/video — 数字人口播视频（无包装）

```
POST https://openapi.shanjian.tv/v1/virtualman/video
Authorization: Bearer {APP_KEY}
```

使用数字人 + 文本生成口播视频（裸视频，无后期包装）。

### 6.2 GET /v1/clip/template — 智能剪辑模板列表

```
GET https://openapi.shanjian.tv/v1/clip/template
Authorization: Bearer {APP_KEY}
```

获取可用的智能剪辑模板列表。

### 6.3 GET /v1/clip/template/detail/{id} — 获取模板详情

```
GET https://openapi.shanjian.tv/v1/clip/template/detail/{id}
Authorization: Bearer {APP_KEY}
```

获取指定模板的详细配置信息。

### 6.4 POST /v1/clip/video/virtualman_broadcast — 数字人口播混剪视频

```
POST https://openapi.shanjian.tv/v1/clip/video/virtualman_broadcast
Authorization: Bearer {APP_KEY}
```

数字人 + 口播文本 + 模板包装 = 成品视频。

### 6.5 POST /v1/clip/video/realman_broadcast — 真人口播混剪视频

```
POST https://openapi.shanjian.tv/v1/clip/video/realman_broadcast
Authorization: Bearer {APP_KEY}
```

使用真人视频素材进行口播混剪。流程：上传视频 → ASR 识别 → 修改文案 → 模板包装。

### 6.6 POST /v1/clip/video/broadcast_mixcut — 素材混剪视频

```
POST https://openapi.shanjian.tv/v1/clip/video/broadcast_mixcut
Authorization: Bearer {APP_KEY}
```

多素材混剪生成视频。

### 6.7 POST /v1/clip/video/news_mixcut — 新闻体视频

```
POST https://openapi.shanjian.tv/v1/clip/video/news_mixcut
Authorization: Bearer {APP_KEY}
```

新闻风格视频生成。

### 6.8 自定义混剪接口

| 接口 | 端点 |
|------|------|
| 自定义数字人口播混剪 | `POST /v1/clip/video/custom_virtualman_broadcast` |
| 自定义真人口播混剪 | `POST /v1/clip/video/custom_realman_broadcast` |
| 自定义素材混剪 | `POST /v1/clip/video/custom_broadcast_mixcut` |

---

## 7. 图片生成 API

### 7.1 GET /v1/clip/image/template — AI 封面模板列表

```
GET https://openapi.shanjian.tv/v1/clip/image/template
Authorization: Bearer {APP_KEY}
```

获取可用的 AI 封面模板。

### 7.2 POST /v1/clip/image/ai_cover — AI 封面图片生成

```
POST https://openapi.shanjian.tv/v1/clip/image/ai_cover
Authorization: Bearer {APP_KEY}
```

使用模板生成 AI 封面图片。

---

## 8. 公共资源 API

### 8.1 GET /v1/assets/voice/common — 公共配音列表

获取平台提供的公共 AI 配音音色，可用于 TTS 合成。

### 8.2 GET /v1/assets/virtualman/common — 公共数字人列表

获取平台提供的公共数字人形象。

---

## 9. 任务查询 API

### 9.1 GET /v1/task/info — 查询任务详情

```
GET https://openapi.shanjian.tv/v1/task/info?taskId={taskId}
Authorization: Bearer {APP_KEY}
```

查询异步任务（克隆、合成等）的执行状态和结果。

---

## 10. 回调通知

### 10.1 制作类接口回调数据结构

制作类接口（声音克隆、数字人克隆、视频合成等）为异步任务，完成后通过回调通知返回结果。

**回调数据结构：**

```json
{
    "taskId": "string",
    "status": "succeed",
    "result": {
        "speakerId": "string",
        "demoAudioUrl": "string"
    },
    "costRights": {
        "credits": 0
    }
}
```

**视频合成类回调额外包含：**

```json
{
    "subtitle": [
        {
            "text": "string",
            "startMs": 0,
            "endMs": 0
        }
    ]
}
```

---

## 11. 错误码

| 错误码 | 说明 |
|--------|------|
| `Invalid.Authorization` | 鉴权失败，请检查 Authorization 请求头 |
| `Request.Limit` | 接口请求 QPS 超限 |
| `Concurrency.Limit` | 并发处理数超限 |
| `Rights.NotEnough` | 权益不足或无相关功能权限 |
| `Invalid.Params` | 参数缺失或错误 |
| `Failed.Timeout` | 任务处理超时，请稍后重试 |

---

## 12. 支持语种代码

参考文档: https://openapi-doc.shanjian.tv/7317825m0

---

## 13. Python SDK 封装示例

由于闪剪 AI 目前没有官方 Python SDK，以下是一个基础封装：

```python
import requests
import time
from typing import Optional


class ShanJianAI:
    """闪剪 AI 开放平台 API 客户端"""

    def __init__(self, api_key: str, base_url: str = "https://openapi.shanjian.tv"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

    # === 声音克隆 ===

    def voice_clone(self, voice_name: str, audio_url: str,
                    model: str = "V3") -> dict:
        """声音克隆"""
        resp = self.session.post(f"{self.base_url}/v1/voice/train", json={
            "voice_name": voice_name,
            "audio_url": audio_url,
            "model": model
        })
        return resp.json()

    def delete_asset(self, asset_id: str) -> dict:
        """删除资产（数字人/声音）"""
        resp = self.session.delete(f"{self.base_url}/v1/assets/{asset_id}")
        return resp.json()

    # === TTS ===

    def tts(self, text: str, speaker_id: str, **kwargs) -> dict:
        """文本转语音"""
        payload = {"text": text, "speaker_id": speaker_id, **kwargs}
        resp = self.session.post(f"{self.base_url}/v1/effect/tts", json=payload)
        return resp.json()

    def list_public_voices(self) -> dict:
        """获取公共配音列表"""
        resp = self.session.get(f"{self.base_url}/v1/assets/voice/common")
        return resp.json()

    # === ASR ===

    def asr(self, audio_url: str) -> dict:
        """语音转文字"""
        resp = self.session.post(f"{self.base_url}/v1/effect/asr", json={
            "audio_url": audio_url
        })
        return resp.json()

    # === 任务查询 ===

    def get_task_info(self, task_id: str) -> dict:
        """查询任务详情"""
        resp = self.session.get(f"{self.base_url}/v1/task/info", params={
            "taskId": task_id
        })
        return resp.json()

    def wait_for_task(self, task_id: str, poll_interval: float = 2.0,
                      timeout: float = 300.0) -> dict:
        """轮询等待任务完成"""
        start = time.time()
        while time.time() - start < timeout:
            result = self.get_task_info(task_id)
            if result.get("status") in ("succeed", "failed"):
                return result
            time.sleep(poll_interval)
        raise TimeoutError(f"Task {task_id} did not complete within {timeout}s")


# === 使用示例 ===

if __name__ == "__main__":
    client = ShanJianAI(api_key="your_app_key")

    # 1. 声音克隆
    clone_result = client.voice_clone(
        voice_name="我的声音",
        audio_url="https://example.com/reference.wav",
        model="V3"
    )
    task_id = clone_result.get("taskId")

    # 2. 等待克隆完成
    task = client.wait_for_task(task_id)
    speaker_id = task["result"]["speakerId"]

    # 3. TTS 合成
    tts_result = client.tts(
        text="你好，这是我的克隆声音！",
        speaker_id=speaker_id
    )

    # 4. ASR 识别
    asr_result = client.asr(audio_url="https://example.com/speech.mp3")
    print(asr_result)
```

---

## 14. 完整 API 端点索引

| 方法 | 端点 | 说明 | 文档链接 |
|------|------|------|---------|
| **克隆** | | | |
| POST | `/v1/virtualman/train` | 专业数字人克隆 | [→](https://openapi-doc.shanjian.tv/342231002e0) |
| POST | `/v1/virtualman/fast/train` | 极速数字人克隆 | [→](https://openapi-doc.shanjian.tv/342232918e0) |
| POST | `/v1/voice/train` | 声音克隆 | [→](https://openapi-doc.shanjian.tv/342241374e0) |
| POST | `/v1/virtualman/image/train` | 图生数字人克隆 | [→](https://openapi-doc.shanjian.tv/347502607e0) |
| DELETE | `/v1/assets/{id}` | 数字人/声音删除 | [→](https://openapi-doc.shanjian.tv/344550029e0) |
| **音频合成** | | | |
| POST | `/v1/effect/tts` | 文本转语音 (TTS) | [→](https://openapi-doc.shanjian.tv/359919256e0) |
| **视频合成** | | | |
| POST | `/v1/virtualman/video` | 数字人口播视频（无包装） | [→](https://openapi-doc.shanjian.tv/342245572e0) |
| GET | `/v1/clip/template` | 智能剪辑模板列表 | [→](https://openapi-doc.shanjian.tv/342258231e0) |
| POST | `/v1/clip/video/virtualman_broadcast` | 数字人口播混剪视频 | [→](https://openapi-doc.shanjian.tv/342271033e0) |
| POST | `/v1/clip/video/realman_broadcast` | 真人口播混剪视频 | [→](https://openapi-doc.shanjian.tv/342282685e0) |
| POST | `/v1/clip/video/broadcast_mixcut` | 素材混剪视频 | [→](https://openapi-doc.shanjian.tv/347508346e0) |
| POST | `/v1/clip/video/news_mixcut` | 新闻体视频 | [→](https://openapi-doc.shanjian.tv/347517114e0) |
| GET | `/v1/clip/template/detail/{id}` | 获取模板详情 | [→](https://openapi-doc.shanjian.tv/382122111e0) |
| POST | `/v1/clip/video/custom_virtualman_broadcast` | 自定义数字人口播混剪 | [→](https://openapi-doc.shanjian.tv/354590181e0) |
| POST | `/v1/clip/video/custom_broadcast_mixcut` | 自定义素材混剪 | [→](https://openapi-doc.shanjian.tv/354615984e0) |
| POST | `/v1/clip/video/custom_realman_broadcast` | 自定义真人口播混剪 | [→](https://openapi-doc.shanjian.tv/360232310e0) |
| **ASR** | | | |
| POST | `/v1/effect/asr` | 音频转文字 (ASR) | [→](https://openapi-doc.shanjian.tv/342294933e0) |
| **图片生成** | | | |
| GET | `/v1/clip/image/template` | AI 封面模板列表 | [→](https://openapi-doc.shanjian.tv/389221892e0) |
| POST | `/v1/clip/image/ai_cover` | AI 封面图片生成 | [→](https://openapi-doc.shanjian.tv/389226151e0) |
| **公共资源** | | | |
| GET | `/v1/assets/voice/common` | 公共配音列表 | [→](https://openapi-doc.shanjian.tv/397345823e0) |
| GET | `/v1/assets/virtualman/common` | 公共数字人列表 | [→](https://openapi-doc.shanjian.tv/397369717e0) |
| **任务** | | | |
| GET | `/v1/task/info` | 查询任务详情 | [→](https://openapi-doc.shanjian.tv/342296170e0) |

---

## 15. 重要文档链接

| 文档 | 链接 |
|------|------|
| API 文档首页 | https://openapi-doc.shanjian.tv/ |
| 控制台（管理 API Key） | https://dev.shanjian.tv/ |
| 产品简介 | https://openapi-doc.shanjian.tv/7289363m0 |
| 快速接入 | https://openapi-doc.shanjian.tv/7289369m0 |
| 产品定价 | https://openapi-doc.shanjian.tv/7324436m0 |
| 错误码 | https://openapi-doc.shanjian.tv/7289356m0 |
| 语种代码参照 | https://openapi-doc.shanjian.tv/7317825m0 |
| 常见问题 | https://openapi-doc.shanjian.tv/7331505m0 |
| 回调数据结构 | https://openapi-doc.shanjian.tv/7694236m0 |
| 官网 | https://www.shanjian.tv/ |

---

> ⚠️ **注意**: 闪剪AI 官方文档使用 Apifox 构建，采用 SPA 客户端渲染。详细的接口参数定义（每个字段的完整类型、必填项、枚举值等）需直接访问 [openapi-doc.shanjian.tv](https://openapi-doc.shanjian.tv/) 查看。本文档内容基于从文档站 Embedded Remix 数据、WebSearch 和官方页面抓取的信息综合整理。
