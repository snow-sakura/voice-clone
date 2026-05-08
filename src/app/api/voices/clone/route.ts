import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { getDashScopeClient } from "../../../../lib/dashscope";
import { createVoice, updateVoiceOnComplete, updateVoiceOnFail } from "../../../../db/queries";
import { handleApiError } from "../../../../lib/api-helpers";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const audio = formData.get("audio");
    const voiceName = formData.get("voiceName");

    // Validate required fields
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing required field: audio (file)" },
        { status: 400 },
      );
    }
    if (!voiceName || !voiceName.toString().trim()) {
      return NextResponse.json(
        { error: "Missing required field: voiceName" },
        { status: 400 },
      );
    }
    const voiceNameStr = voiceName.toString().trim();

    // Validate file extension
    const extension = audio.name ? audio.name.split(".").pop()?.toLowerCase() : "";
    const allowedExtensions = ["wav", "mp3", "flac", "m4a", "aac", "ogg", "webm"];
    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${extension || "unknown"}. Supported: ${allowedExtensions.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate file size (max 15MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(audio.size / 1024 / 1024).toFixed(1)}MB. Maximum: 15MB` },
        { status: 400 },
      );
    }

    // Ensure the uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Save the uploaded audio file locally
    const filename = `voice-${randomUUID()}.${extension}`;
    const filePath = join(uploadsDir, filename);

    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buffer);

    const savedFilePath = `/uploads/${filename}`;

    // Determine MIME type for the DashScope API
    const mimeTypes: Record<string, string> = {
      wav: "audio/wav",
      mp3: "audio/mpeg",
      flac: "audio/flac",
      m4a: "audio/mp4",
      aac: "audio/aac",
      ogg: "audio/ogg",
      webm: "audio/webm",
    };
    const mimeType = mimeTypes[extension] ?? "audio/wav";

    // Save initial DB record (status: "pending")
    const dbVoice = await createVoice(voiceNameStr, "qwen-voice-enrollment", savedFilePath);

    // Call DashScope to clone the voice (single API call with base64 audio)
    try {
      const client = getDashScopeClient();
      const audioBase64 = buffer.toString("base64");

      const cloneResult = await client.voiceClone({
        voiceName: voiceNameStr,
        audioBase64,
        audioMimeType: mimeType,
      });

      console.log("[clone] DashScope clone result:", JSON.stringify(cloneResult, null, 2));

      // Mark voice as completed in the database
      await updateVoiceOnComplete(dbVoice.id, cloneResult.voiceId, cloneResult.previewAudioUrl ?? "");

      return NextResponse.json({
        success: true,
        voiceId: dbVoice.id,
        apiVoiceId: cloneResult.voiceId,
        demoAudioUrl: cloneResult.previewAudioUrl ?? null,
      });
    } catch (cloneError) {
      const errorMessage =
        cloneError instanceof Error ? cloneError.message : String(cloneError);
      console.error("[clone] DashScope clone failed:", errorMessage);
      await updateVoiceOnFail(dbVoice.id, errorMessage);
      throw cloneError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
