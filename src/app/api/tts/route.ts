import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDashScopeClient } from "@/lib/dashscope";
import { saveAudioToLocal } from "@/lib/audio-helpers";
import { getCurrentUser } from "@/lib/auth";
import { createActivity } from "@/db/queries";
import { handleApiError } from "@/lib/api-helpers";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limiter";

// ── POST handler ──

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 速率限制检查
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `tts:${clientId}:${user.id}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.tts);

    if (!rateLimitResult.success) {
      const waitSeconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: `请求过于频繁，请 ${waitSeconds} 秒后再试` },
        { status: 429 }
      );
    }

    // ── Parse body ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "无效的请求体" },
        { status: 400 },
      );
    }

    // ── Validate required fields ──
    const input = body.input;
    if (typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json(
        { error: "文本内容不能为空" },
        { status: 400 },
      );
    }

    // 文本长度限制
    if (input.trim().length > 5000) {
      return NextResponse.json(
        { error: "文本长度不能超过 5000 字符" },
        { status: 400 },
      );
    }

    const voice = body.voice;
    if (typeof voice !== "string" || voice.trim().length === 0) {
      return NextResponse.json(
        { error: "请选择音色" },
        { status: 400 },
      );
    }

    // ── Parse optional fields ──
    let model: string | undefined;
    if (body.model !== undefined) {
      if (typeof body.model !== "string") {
        return NextResponse.json(
          { error: "模型参数无效" },
          { status: 400 },
        );
      }
      model = body.model;
    }

    // Auto-select model based on voice ID type
    if (!model) {
      model = voice.trim().startsWith("qwen-tts-vc-")
        ? "qwen3-tts-vc-2026-01-22"
        : "qwen-tts-2025-05-22";
    }

    let languageType: string | undefined;
    if (body.languageType !== undefined) {
      if (typeof body.languageType !== "string") {
        return NextResponse.json(
          { error: "语言类型参数无效" },
          { status: 400 },
        );
      }
      languageType = body.languageType;
    }

    // ── Call the DashScope TTS API ──
    const client = getDashScopeClient();
    const audioBuffer = await client.textToSpeech({
      input: input.trim(),
      voice: voice.trim(),
      model,
      languageType,
    });

    // ── Save audio to secure directory ──
    const filename = `${randomUUID()}.wav`;
    const audioUrl = await saveAudioToLocal(audioBuffer, filename);

    // 记录活动
    await createActivity(user.id, "tts", `生成语音：${input.trim().slice(0, 50)}...`, {
      voice: voice.trim(),
      textLength: input.trim().length,
    });

    // ── Return success ──
    return NextResponse.json({
      success: true,
      audioUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
