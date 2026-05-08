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

    let responseFormat: string | undefined;
    if (body.responseFormat !== undefined) {
      if (typeof body.responseFormat !== "string") {
        return NextResponse.json(
          { error: "Field 'responseFormat' must be a string" },
          { status: 400 },
        );
      }
      responseFormat = body.responseFormat;
    }

    let speed: number | undefined;
    if (body.speed !== undefined) {
      speed = Number(body.speed);
      if (isNaN(speed)) {
        return NextResponse.json(
          { error: "Field 'speed' must be a number" },
          { status: 400 },
        );
      }
    }

    let volume: number | undefined;
    if (body.volume !== undefined) {
      volume = Number(body.volume);
      if (isNaN(volume)) {
        return NextResponse.json(
          { error: "Field 'volume' must be a number" },
          { status: 400 },
        );
      }
    }

    // ── Call the DashScope TTS API ──
    const client = getDashScopeClient();
    const audioBuffer = await client.textToSpeech({
      input: input.trim(),
      voice: voice.trim(),
      model,
      responseFormat,
      speed,
      volume,
    });

    // ── Save audio to local public/tts_output directory ──
    const ext = responseFormat ?? "wav";
    const filename = `${randomUUID()}.${ext}`;
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
