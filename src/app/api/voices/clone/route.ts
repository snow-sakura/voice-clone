import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { getZhipuClient } from "../../../../lib/zhipu";
import { createVoice, updateVoiceOnComplete, updateVoiceOnFail } from "../../../../db/queries";
import { handleApiError } from "../../../../lib/api-helpers";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const audio = formData.get("audio");
    const voiceName = formData.get("voiceName");
    const text = formData.get("text");
    const input = formData.get("input");

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
    if (!text || !text.toString().trim()) {
      return NextResponse.json(
        { error: "Missing required field: text (audio transcript)" },
        { status: 400 },
      );
    }
    if (!input || !input.toString().trim()) {
      return NextResponse.json(
        { error: "Missing required field: input (demo text)" },
        { status: 400 },
      );
    }

    const voiceNameStr = voiceName.toString().trim();
    const textStr = text.toString().trim();
    const inputStr = input.toString().trim();

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

    // Generate a unique filename and save the uploaded audio file
    const filename = `voice-${randomUUID()}.${extension}`;
    const filePath = join(uploadsDir, filename);

    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buffer);

    // Save the relative path for storage
    const savedFilePath = `/uploads/${filename}`;

    // Save initial DB record (status: "pending")
    const dbVoice = await createVoice(voiceNameStr, "glm-tts-clone", savedFilePath);

    // Call Zhipu AI to clone the voice
    try {
      const client = getZhipuClient();

      // Step 1: Upload the reference audio file to Zhipu
      const uploadResult = await client.uploadFile(filePath);
      console.log("[clone] Zhipu upload result:", JSON.stringify(uploadResult, null, 2));

      // Step 2: Clone the voice using the uploaded file_id
      const cloneResult = await client.voiceClone({
        voiceName: voiceNameStr,
        text: textStr,
        input: inputStr,
        fileId: uploadResult.id,
        model: "glm-tts-clone",
      });
      console.log("[clone] Zhipu clone result:", JSON.stringify(cloneResult, null, 2));

      const { voice_id, audio_url } = cloneResult;

      // Mark voice as completed in the database
      await updateVoiceOnComplete(dbVoice.id, voice_id, audio_url ?? "");

      return NextResponse.json({
        success: true,
        voiceId: dbVoice.id,
        zhipuVoiceId: voice_id,
        demoAudioUrl: audio_url,
      });
    } catch (cloneError) {
      const errorMessage =
        cloneError instanceof Error ? cloneError.message : String(cloneError);
      console.error("[clone] Zhipu clone failed:", errorMessage);
      await updateVoiceOnFail(dbVoice.id, errorMessage);
      throw cloneError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
