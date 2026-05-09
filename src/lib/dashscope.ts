// ============================================================
// Alibaba Cloud DashScope (百炼) API Client
// API docs: https://help.aliyun.com/zh/model-studio/
// Base URL: https://dashscope.aliyuncs.com/api/v1
// Auth: Bearer token from DASHSCOPE_API_KEY env var
// ============================================================

// ── Request parameter types ──

export interface VoiceCloneParams {
  /** Custom name for the cloned voice (≤10 chars, lowercase letters/numbers only) */
  voiceName: string
  /** Base64-encoded audio data (without the data: prefix) */
  audioBase64: string
  /** MIME type of the audio (e.g. "audio/wav", "audio/mpeg") */
  audioMimeType: string
  /** Target TTS model (default: qwen3-tts-vc-2026-01-22) */
  targetModel?: string
}

export interface TextToSpeechParams {
  /** Text to synthesize */
  input: string
  /** Voice ID (from voice enrollment) or preset voice name */
  voice: string
  /** Model (default: qwen3-tts-vc-2026-01-22) */
  model?: string
  /** Language hint: Auto / Chinese / English / Japanese / Korean / etc. */
  languageType?: string
}

// ── Response types ──

export interface VoiceCloneResponse {
  voiceId: string
  requestId?: string
  previewAudioUrl?: string
}

export interface DashScopeErrorBody {
  code: string
  message: string
}

// ── Error class ──

export class DashScopeError extends Error {
  public status: number
  public code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "DashScopeError"
    this.status = status
    this.code = code
  }
}

// ── Constants ──

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/api/v1"
const DEFAULT_TARGET_MODEL = "qwen3-tts-vc-2026-01-22"
const ENROLLMENT_MODEL = "qwen-voice-enrollment"

// ── API Client ──

export class DashScope {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.DASHSCOPE_API_KEY ?? ""
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL

    if (!this.apiKey) {
      throw new Error(
        "DashScope API key is required. Set DASHSCOPE_API_KEY in your environment or pass it to the constructor.",
      )
    }
  }

  // ── Private helpers ──

  private async parseError(response: Response): Promise<DashScopeError> {
    let errorMessage = `API request failed with status ${response.status}: ${response.statusText}`
    let errorCode: string | undefined

    let rawBody = ""
    try {
      rawBody = await response.text()
      const errorBody = JSON.parse(rawBody)
      console.error("[DashScope] Error response body:", JSON.stringify(errorBody, null, 2))
      if (errorBody?.code) {
        errorCode = errorBody.code
      }
      if (errorBody?.message) {
        errorMessage = errorBody.message
      }
    } catch {
      console.error("[DashScope] Error response (non-JSON):", rawBody)
    }

    return new DashScopeError(errorMessage, response.status, errorCode)
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}${path}`

    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }

    if (body !== undefined) {
      init.body = JSON.stringify(body)
    }

    let response: Response
    try {
      response = await fetch(url, init)
    } catch (err) {
      throw new DashScopeError(
        `DashScope network error: ${err instanceof Error ? err.message : String(err)}`,
        0,
      )
    }

    if (!response.ok) {
      throw await this.parseError(response)
    }

    if (response.status === 204) {
      return {}
    }

    const data = await response.json()

    if (data && typeof data === "object" && "code" in data && "message" in data && !("output" in data)) {
      throw new DashScopeError(data.message as string, response.status, data.code as string)
    }

    return data as Record<string, unknown>
  }

  // ── Public API methods ──

  /**
   * Clone a voice from a reference audio file.
   * POST /api/v1/services/audio/tts/customization
   *
   * Uses qwen-voice-enrollment model with base64-encoded audio.
   * The returned voice_id can be used immediately for TTS synthesis.
   */
  async voiceClone(params: VoiceCloneParams): Promise<VoiceCloneResponse> {
    const targetModel = params.targetModel ?? DEFAULT_TARGET_MODEL

    // Sanitize voice name: ≤10 chars, lowercase letters/numbers only.
    // If the name contains only non-Latin characters (e.g. Chinese), fall back to a random name.
    const preferredName =
      params.voiceName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10) || `vc${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

    const body: Record<string, unknown> = {
      model: ENROLLMENT_MODEL,
      input: {
        action: "create",
        target_model: targetModel,
        preferred_name: preferredName,
        audio: {
          data: `data:${params.audioMimeType};base64,${params.audioBase64}`,
        },
      },
    }

    const data = await this.request("POST", "/services/audio/tts/customization", body)

    const output = data.output as Record<string, unknown> | undefined
    const voiceId = output?.["voice_id"] ?? output?.voice

    if (!voiceId || typeof voiceId !== "string") {
      throw new DashScopeError(
        `Voice enrollment response missing voice_id: ${JSON.stringify(data)}`,
        502,
      )
    }

    return {
      voiceId,
      requestId: data.request_id as string | undefined,
      previewAudioUrl: extractAudioUrl(output),
    }
  }

  /**
   * Convert text to speech using a cloned or preset voice.
   * POST /api/v1/services/aigc/multimodal-generation/generation
   *
   * Returns the raw audio data as a Buffer.
   */
  async textToSpeech(params: TextToSpeechParams): Promise<Buffer> {
    const model = params.model ?? DEFAULT_TARGET_MODEL

    const input: Record<string, unknown> = {
      text: params.input,
      voice: params.voice,
    }
    if (params.languageType) {
      input.language_type = params.languageType
    }

    const body: Record<string, unknown> = {
      model,
      input,
    }

    const data = await this.request(
      "POST",
      "/services/aigc/multimodal-generation/generation",
      body,
    )

    const output = data.output as Record<string, unknown> | undefined

    // Try to extract audio from response
    return extractAudioBuffer(data, output)
  }
}

// ── Audio extraction helpers ──

function extractAudioUrl(output: Record<string, unknown> | undefined): string | undefined {
  if (!output) return undefined

  // Try output.preview_audio.url
  const previewAudio = output["preview_audio"]
  if (previewAudio && typeof previewAudio === "object") {
    const url = (previewAudio as Record<string, unknown>)["url"]
    if (typeof url === "string") return url
  }

  // Try output.audio.url
  const audio = output["audio"]
  if (audio && typeof audio === "object") {
    const url = (audio as Record<string, unknown>)["url"]
    if (typeof url === "string") return url
  }

  return undefined
}

async function extractAudioBuffer(
  data: Record<string, unknown>,
  output: Record<string, unknown> | undefined,
): Promise<Buffer> {
  // Case 1: output.choices[0].message.content — multimodal-generation format
  if (output) {
    const choices = output["choices"]
    if (Array.isArray(choices) && choices.length > 0) {
      const message = (choices[0] as Record<string, unknown>)["message"]
      if (message && typeof message === "object") {
        const content = (message as Record<string, unknown>)["content"]
        if (Array.isArray(content) && content.length > 0) {
          for (const item of content) {
            if (item && typeof item === "object") {
              const c = item as Record<string, unknown>
              // content item may have "audio" as a URL string or object with url/data
              const audioVal = c["audio"]
              if (typeof audioVal === "string" && audioVal.length > 0) {
                // Could be a URL or base64 data URL
                if (audioVal.startsWith("http://") || audioVal.startsWith("https://")) {
                  const res = await fetch(audioVal)
                  if (!res.ok) {
                    throw new DashScopeError(
                      `Failed to download TTS audio from choices URL (status ${res.status})`,
                      502,
                    )
                  }
                  return Buffer.from(await res.arrayBuffer())
                }
                if (audioVal.startsWith("data:")) {
                  const b64 = audioVal.split(",")[1]
                  if (b64) return Buffer.from(b64, "base64")
                }
                // Assume raw base64
                return Buffer.from(audioVal, "base64")
              }
              if (audioVal && typeof audioVal === "object") {
                const aObj = audioVal as Record<string, unknown>
                const url = aObj["url"]
                if (typeof url === "string" && url.length > 0) {
                  const res = await fetch(url)
                  if (!res.ok) {
                    throw new DashScopeError(
                      `Failed to download TTS audio from choices content URL (status ${res.status})`,
                      502,
                    )
                  }
                  return Buffer.from(await res.arrayBuffer())
                }
                const b64 = aObj["data"]
                if (typeof b64 === "string" && b64.length > 0) {
                  return Buffer.from(b64, "base64")
                }
              }
            }
          }
        }
      }
    }
  }

  // Case 2: output.audio.url — SpeechSynthesizer-style response, download from URL
  if (output) {
    const audio = output["audio"]
    if (audio && typeof audio === "object") {
      const audioObj = audio as Record<string, unknown>
      const url = audioObj["url"]
      if (typeof url === "string" && url.length > 0) {
        const res = await fetch(url)
        if (!res.ok) {
          throw new DashScopeError(
            `Failed to download TTS audio from URL (status ${res.status})`,
            502,
          )
        }
        return Buffer.from(await res.arrayBuffer())
      }

      // Case 3: output.audio.data — base64 data
      const base64Data = audioObj["data"]
      if (typeof base64Data === "string" && base64Data.length > 0) {
        return Buffer.from(base64Data, "base64")
      }
    }

    // Case 4: output.audio is a string (base64)
    const audioStr = output["audio"]
    if (typeof audioStr === "string" && audioStr.length > 0) {
      return Buffer.from(audioStr, "base64")
    }
  }

  // Case 5: root-level audio_url
  const audioUrl = data["audio_url"]
  if (typeof audioUrl === "string") {
    const res = await fetch(audioUrl)
    if (!res.ok) {
      throw new DashScopeError(
        `Failed to download TTS audio from URL (status ${res.status})`,
        502,
      )
    }
    return Buffer.from(await res.arrayBuffer())
  }

  throw new DashScopeError(
    `Unexpected TTS response format: ${JSON.stringify(data).slice(0, 500)}`,
    502,
  )
}

// ── Convenience default instance ──

let _defaultClient: DashScope | undefined

export function getDashScopeClient(): DashScope {
  if (!_defaultClient) {
    _defaultClient = new DashScope()
  }
  return _defaultClient
}
