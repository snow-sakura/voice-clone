import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getShanJianClient } from "../../../lib/shanjian";
import { saveAudioToLocal } from "../../../lib/audio-helpers";
import type { TtsSubtitle } from "../../../lib/shanjian";

// ── Helpers ──

function firstStringLike(
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > 0) return val;
  }
  return undefined;
}

/**
 * Build the response payload from the raw API response.
 */
async function buildResponse(
  rawResponse: Record<string, unknown>,
): Promise<{
  audioUrl: string;
  subtitle: TtsSubtitle[] | undefined;
}> {
  // Extract subtitle from the typed response
  const subtitle = rawResponse.subtitle as TtsSubtitle[] | undefined;

  // Check for an audio URL in the response body
  const audioUrl = firstStringLike(rawResponse, [
    "audio_url",
    "audioUrl",
    "audio",
    "url",
  ]);

  if (audioUrl) {
    // If it's already an external URL, download and save it locally
    const ext = guessExtensionFromUrl(audioUrl);
    const filename = `${randomUUID()}.${ext}`;
    const localUrl = await saveAudioToLocal(audioUrl, filename);
    return { audioUrl: localUrl, subtitle };
  }

  // Check for base64-encoded audio data in the response body
  const audioBase64 = firstStringLike(rawResponse, [
    "audio_data",
    "audioData",
    "audio_base64",
    "audioBase64",
    "data",
  ]);

  if (audioBase64) {
    const ext = "mp3";
    const filename = `${randomUUID()}.${ext}`;
    // Prepend data: prefix so saveAudioToLocal handles it as a data URL
    const source = audioBase64.startsWith("data:")
      ? audioBase64
      : `data:audio/mpeg;base64,${audioBase64}`;
    const localUrl = await saveAudioToLocal(source, filename);
    return { audioUrl: localUrl, subtitle };
  }

  // Check for raw audio data as array of numbers (Buffer serialized as array)
  const rawData = rawResponse.audio_data ?? rawResponse.audioData;
  if (Array.isArray(rawData) && rawData.every((v) => typeof v === "number")) {
    const ext = "mp3";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(rawData as number[]);
    const localUrl = await saveAudioToLocal(buffer, filename);
    return { audioUrl: localUrl, subtitle };
  }

  throw new Error(
    "TTS API response did not contain recognizable audio data or URL. " +
      `Available keys: ${Object.keys(rawResponse).join(", ")}`,
  );
}

/** Guess file extension from a URL path; falls back to "mp3". */
function guessExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(\w+)$/);
    return match ? match[1] : "mp3";
  } catch {
    return "mp3";
  }
}

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
    const text = body.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'text' is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const speakerId = body.speakerId;
    if (typeof speakerId !== "string" || speakerId.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Field 'speakerId' is required and must be a non-empty string",
        },
        { status: 400 },
      );
    }

    // ── Parse optional fields ──
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

    let format: string | undefined;
    if (body.format !== undefined) {
      if (typeof body.format !== "string") {
        return NextResponse.json(
          { error: "Field 'format' must be a string" },
          { status: 400 },
        );
      }
      format = body.format;
    }

    // ── Call the Shanjian TTS API ──
    const client = getShanJianClient();
    const ttsResponse = await client.textToSpeech({
      text: text.trim(),
      speakerId: speakerId.trim(),
      speed,
      volume,
      format: format ?? "mp3",
    });

    // ── Process the response and save audio locally ──
    const { audioUrl, subtitle } = await buildResponse(
      ttsResponse as unknown as Record<string, unknown>,
    );

    // ── Build success payload ──
    const payload: Record<string, unknown> = {
      success: true,
      audioUrl,
    };
    if (subtitle) {
      payload.subtitle = subtitle;
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/tts error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Determine if it's a known error from the Shanjian client
    const status =
      (error as { status?: number }).status &&
      typeof (error as { status?: number }).status === "number" &&
      (error as { status?: number }).status! >= 400
        ? (error as { status?: number }).status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
