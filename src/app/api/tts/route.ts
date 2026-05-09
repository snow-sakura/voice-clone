import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDashScopeClient, DashScopeError } from "../../../lib/dashscope";
import { saveAudioToLocal } from "../../../lib/audio-helpers";

// ── POST handler ──

export async function POST(request: NextRequest) {
  try {
    // ── Parse body ──
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    // ── Validate required fields ──
    const input = body.input;
    if (typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'input' is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const voice = body.voice;
    if (typeof voice !== "string" || voice.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'voice' is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // ── Parse optional fields ──
    let model: string | undefined;
    if (body.model !== undefined) {
      if (typeof body.model !== "string") {
        return NextResponse.json(
          { error: "Field 'model' must be a string" },
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
          { error: "Field 'languageType' must be a string" },
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

    // ── Save audio to local public/tts_output directory ──
    const filename = `${randomUUID()}.wav`;
    const audioUrl = await saveAudioToLocal(audioBuffer, filename);

    // ── Return success ──
    return NextResponse.json({
      success: true,
      audioUrl,
    });
  } catch (error) {
    console.error("POST /api/tts error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    const status =
      error instanceof DashScopeError ? error.status : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
