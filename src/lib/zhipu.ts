// ============================================================
// Zhipu AI (智谱AI) API Client
// API docs: https://docs.bigmodel.cn/
// Base URL: https://open.bigmodel.cn/api/paas/v4
// Auth: Bearer token from ZHIPU_API_KEY env var
// ============================================================

import { readFile } from "fs/promises";

// ── Request parameter types (camelCase, converted to snake_case internally) ──

export interface VoiceCloneParams {
  /** Custom name for the cloned voice */
  voiceName: string;
  /** Reference audio transcription text (helps alignment) */
  text: string;
  /** Demo text for generating a trial audio clip */
  input: string;
  /** File ID from the uploaded reference audio */
  fileId: string;
  /** Model version (default: glm-tts-clone) */
  model?: string;
  /** Optional unique request identifier */
  requestId?: string;
}

export interface TextToSpeechParams {
  /** Text to synthesize (UTF-8) */
  input: string;
  /** Voice ID (from voice/clone) or preset voice name */
  voice: string;
  /** Model: cogtts or glm-tts (default: cogtts) */
  model?: string;
  /** Output audio format: wav or mp3 (default: wav) */
  responseFormat?: string;
  /** Speech speed 0.25~4.0 (default: 1.0) */
  speed?: number;
  /** Volume gain -10dB~+10dB (default: 0) */
  volume?: number;
}

// ── Response types (snake_case, matching the raw API response) ──

export interface FileUploadResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

export interface VoiceCloneResponse {
  voice_id: string;
  audio_url?: string;
  request_id?: string;
}

export interface ZhipuErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ── Error class ──

export class ZhipuError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ZhipuError";
    this.status = status;
    this.code = code;
  }
}

// ── API Client ──

export class ZhipuAI {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Create a new Zhipu AI client.
   * @param apiKey - Optional API key. If not provided, reads from process.env.ZHIPU_API_KEY.
   * @param baseUrl - Optional base URL override (default: https://open.bigmodel.cn/api/paas/v4).
   */
  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.ZHIPU_API_KEY ?? "";
    this.baseUrl = baseUrl ?? "https://open.bigmodel.cn/api/paas/v4";

    if (!this.apiKey) {
      throw new Error(
        "ZhipuAI API key is required. Set ZHIPU_API_KEY in your environment or pass it to the constructor.",
      );
    }
  }

  // ── Private helpers ──

  /**
   * Parse an error response body (JSON with { error: { code, message } }).
   */
  private async parseError(response: Response): Promise<ZhipuError> {
    let errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
    let errorCode: string | undefined;

    try {
      const errorBody = (await response.json()) as ZhipuErrorBody;
      if (errorBody?.error) {
        errorMessage = errorBody.error.message || errorMessage;
        errorCode = errorBody.error.code;
      }
    } catch {
      // Response body is not JSON — use the default message
    }

    return new ZhipuError(errorMessage, response.status, errorCode);
  }

  /**
   * Low-level JSON request wrapper. Serializes body as JSON, parses JSON responses,
   * and throws a typed ZhipuError on non-OK status codes.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const init: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    };

    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      throw new ZhipuError(
        `ZhipuAI network error: ${err instanceof Error ? err.message : String(err)}`,
        0,
      );
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    // Handle 204 No Content (e.g. successful DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    // Zhipu may also return errors with HTTP 200
    if (data && typeof data === "object" && "error" in data) {
      const err = data as ZhipuErrorBody;
      throw new ZhipuError(err.error.message, response.status, err.error.code);
    }

    return data as T;
  }

  // ── Public API methods ──

  /**
   * Upload a file to Zhipu AI.
   * POST /files (multipart/form-data)
   *
   * @param filePath - Local path to the file to upload.
   * @param purpose - File purpose (default: "file-extract").
   * @returns The uploaded file info including the file ID.
   */
  async uploadFile(
    filePath: string,
    purpose: string = "file-extract",
  ): Promise<FileUploadResponse> {
    const fileBuffer = await readFile(filePath);
    const fileName = filePath.split("/").pop() ?? "audio.wav";

    // Determine content type from file extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      wav: "audio/wav",
      mp3: "audio/mpeg",
      flac: "audio/flac",
      m4a: "audio/mp4",
      ogg: "audio/ogg",
      webm: "audio/webm",
    };
    const mimeType = mimeTypes[ext ?? ""] ?? "application/octet-stream";

    const blob = new Blob([fileBuffer], { type: mimeType });
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("purpose", purpose);

    const url = `${this.baseUrl}/files`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // Do NOT set Content-Type for multipart/form-data;
          // fetch sets it automatically with the correct boundary.
        },
        body: formData,
      });
    } catch (err) {
      throw new ZhipuError(
        `ZhipuAI network error: ${err instanceof Error ? err.message : String(err)}`,
        0,
      );
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    const data = await response.json();

    // Check for error in 200 response
    if (data && typeof data === "object" && "error" in data) {
      const err = data as ZhipuErrorBody;
      throw new ZhipuError(err.error.message, response.status, err.error.code);
    }

    return data as FileUploadResponse;
  }

  /**
   * Clone a voice from a reference audio file.
   * POST /voice/clone
   *
   * @param params - Voice cloning parameters (camelCase, auto-converted to snake_case).
   * @returns The cloned voice ID and optional demo audio URL.
   */
  async voiceClone(params: VoiceCloneParams): Promise<VoiceCloneResponse> {
    const body: Record<string, unknown> = {
      voice_name: params.voiceName,
      text: params.text,
      input: params.input,
      file_id: params.fileId,
      model: params.model ?? "glm-tts-clone",
    };
    if (params.requestId) {
      body.request_id = params.requestId;
    }

    return this.request<VoiceCloneResponse>("POST", "/voice/clone", body);
  }

  /**
   * Convert text to speech using a cloned or preset voice.
   * POST /audio/speech
   *
   * Returns the raw audio data as a Buffer (Zhipu TTS returns binary audio, not JSON).
   *
   * @param params - TTS parameters (camelCase, auto-converted to snake_case).
   * @returns Buffer containing the audio binary data.
   */
  async textToSpeech(params: TextToSpeechParams): Promise<Buffer> {
    const body: Record<string, unknown> = {
      model: params.model ?? "cogtts",
      input: params.input,
      voice: params.voice,
    };
    if (params.responseFormat !== undefined) {
      body.response_format = params.responseFormat;
    }
    if (params.speed !== undefined) {
      body.speed = params.speed;
    }
    if (params.volume !== undefined) {
      body.volume = params.volume;
    }

    const url = `${this.baseUrl}/audio/speech`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ZhipuError(
        `ZhipuAI network error: ${err instanceof Error ? err.message : String(err)}`,
        0,
      );
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Delete an uploaded file by ID.
   * DELETE /files/{file_id}
   *
   * @param fileId - The file ID to delete.
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.request("DELETE", `/files/${fileId}`);
  }
}

// ── Convenience default instance (reads ZHIPU_API_KEY from env) ──

/**
 * Shared singleton instance. Lazily created so callers that never touch it
 * on startup don't trigger the missing-key error.
 */
let _defaultClient: ZhipuAI | undefined;

export function getZhipuClient(): ZhipuAI {
  if (!_defaultClient) {
    _defaultClient = new ZhipuAI();
  }
  return _defaultClient;
}
