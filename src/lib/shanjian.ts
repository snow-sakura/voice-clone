// ============================================================
// ShanJian AI (闪剪AI) API Client
// API docs: https://openapi-doc.shanjian.tv/
// Base URL: https://openapi.shanjian.tv
// Auth: Bearer token from SHANJIAN_API_KEY env var
// ============================================================

// ── Request parameter types (camelCase, converted to snake_case internally) ──

export interface VoiceCloneParams {
  /** Name for the cloned voice */
  voiceName: string;
  /** Reference audio URL (5-120 seconds) */
  audioUrl?: string;
  /** Reference audio as base64-encoded string */
  audioBase64?: string;
  /** Model version: V1, V2, V3 (default), S1, S3 */
  model?: string;
}

export interface TtsParams {
  /** Text to synthesize */
  text: string;
  /** Speaker ID from voice cloning or public voice list */
  speakerId: string;
  /** Speech speed (e.g. 1.0 = normal, 1.5 = 1.5x) */
  speed?: number;
  /** Volume level */
  volume?: number;
  /** Output audio format (mp3, wav, etc.) */
  format?: string;
}

export interface WaitForTaskOptions {
  /** Polling interval in seconds (default: 2) */
  pollInterval?: number;
  /** Maximum wait time in seconds (default: 300) */
  timeout?: number;
}

// ── Response types (snake_case, matching the raw API response) ──

export interface TaskResponse {
  taskId: string;
  status: string;
  result?: {
    speakerId?: string;
    demoAudioUrl?: string;
    [key: string]: unknown;
  };
  costRights?: {
    credits: number;
  };
  [key: string]: unknown;
}

export interface TtsSubtitle {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TtsResponse {
  subtitle?: TtsSubtitle[];
  [key: string]: unknown;
}

// ── Error class ──

export class ShanJianError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ShanJianError";
    this.status = status;
  }
}

// ── API Client ──

export class ShanJianAI {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  /**
   * Create a new ShanJian AI client.
   * @param apiKey - Optional API key. If not provided, reads from process.env.SHANJIAN_API_KEY.
   * @param baseUrl - Optional base URL override (default: https://openapi.shanjian.tv).
   */
  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey ?? process.env.SHANJIAN_API_KEY ?? "";
    this.baseUrl = baseUrl ?? "https://openapi.shanjian.tv";

    if (!this.apiKey) {
      throw new Error(
        "ShanJianAI API key is required. Set SHANJIAN_API_KEY in your environment or pass it to the constructor.",
      );
    }
  }

  // ── Private helpers ──

  /**
   * Low-level request wrapper. Serializes body as JSON, parses JSON responses,
   * and throws a typed ShanJianError on non-OK status codes.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (queryParams) {
      const sp = new URLSearchParams(queryParams);
      url += `?${sp.toString()}`;
    }

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
      throw new Error(
        `ShanJianAI network error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorBody = await response.json();
        errorMessage =
          errorBody.message ??
          errorBody.error ??
          errorBody.code ??
          `API request failed with status ${response.status}`;
      } catch {
        errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
      }
      throw new ShanJianError(errorMessage, response.status);
    }

    // Handle 204 No Content (e.g. successful DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // ── Public API methods ──

  /**
   * Submit a voice cloning task.
   * POST /v1/voice/train
   */
  async voiceClone(params: VoiceCloneParams): Promise<TaskResponse> {
    const body: Record<string, unknown> = {
      voice_name: params.voiceName,
      model: params.model ?? "V3",
    };
    if (params.audioUrl) body.audio_url = params.audioUrl;
    if (params.audioBase64) body.audio_base64 = params.audioBase64;

    return this.request<TaskResponse>("POST", "/v1/voice/train", body);
  }

  /**
   * Query the status and result of an async task.
   * GET /v1/task/info?taskId={taskId}
   */
  async getTaskInfo(taskId: string): Promise<TaskResponse> {
    return this.request<TaskResponse>("GET", "/v1/task/info", undefined, {
      taskId,
    });
  }

  /**
   * Convert text to speech using a cloned or public voice.
   * POST /v1/effect/tts
   */
  async textToSpeech(params: TtsParams): Promise<TtsResponse> {
    const body: Record<string, unknown> = {
      text: params.text,
      speaker_id: params.speakerId,
    };
    if (params.speed !== undefined) body.speed = params.speed;
    if (params.volume !== undefined) body.volume = params.volume;
    if (params.format !== undefined) body.format = params.format;

    return this.request<TtsResponse>("POST", "/v1/effect/tts", body);
  }

  /**
   * Get the list of public AI voices available on the platform.
   * GET /v1/assets/voice/common
   */
  async getPublicVoices(): Promise<TaskResponse> {
    return this.request<TaskResponse>("GET", "/v1/assets/voice/common");
  }

  /**
   * Delete a voice or digital human asset by ID.
   * DELETE /v1/assets/{id}
   */
  async deleteAsset(assetId: string): Promise<TaskResponse> {
    return this.request<TaskResponse>("DELETE", `/v1/assets/${assetId}`);
  }

  /**
   * Poll a task until it completes or fails.
   *
   * Polls GET /v1/task/info every `pollInterval` seconds (default 2s)
   * until the task status is "succeed", "failed", or "error".
   * Throws if the task does not complete within `timeout` seconds (default 300s).
   */
  async waitForTask(
    taskId: string,
    options?: WaitForTaskOptions,
  ): Promise<TaskResponse> {
    const pollIntervalMs = (options?.pollInterval ?? 2) * 1000;
    const timeoutMs = (options?.timeout ?? 300) * 1000;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const result = await this.getTaskInfo(taskId);
      const status = result.status?.toLowerCase();

      if (status === "succeed" || status === "failed" || status === "error") {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
      `Task ${taskId} did not complete within ${options?.timeout ?? 300}s`,
    );
  }
}

// ── Convenience default instance (reads SHANJIAN_API_KEY from env) ──

/**
 * Shared singleton instance. Lazily created so callers that never touch it
 * on startup don't trigger the missing-key error.
 */
let _defaultClient: ShanJianAI | undefined;

export function getShanJianClient(): ShanJianAI {
  if (!_defaultClient) {
    _defaultClient = new ShanJianAI();
  }
  return _defaultClient;
}
