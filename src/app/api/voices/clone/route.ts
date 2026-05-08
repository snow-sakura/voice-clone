import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { getShanJianClient } from "../../../../lib/shanjian";
import { createVoice } from "../../../../db/queries";
import { handleApiError } from "../../../../lib/api-helpers";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const audio = formData.get("audio");
    const voiceName = formData.get("voiceName");
    const model = formData.get("model")?.toString() ?? "V3";

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing required field: audio (file)" },
        { status: 400 },
      );
    }

    if (!voiceName) {
      return NextResponse.json(
        { error: "Missing required field: voiceName" },
        { status: 400 },
      );
    }

    const voiceNameStr = voiceName.toString();

    // Ensure the uploads directory exists
    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename and save the uploaded file
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const extension = audio.name ? audio.name.split(".").pop() ?? "wav" : "wav";
    const filename = `voice-${uniqueSuffix}.${extension}`;
    const filePath = join(uploadsDir, filename);

    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buffer);

    // Convert to base64 directly from the in-memory buffer
    const base64Data = buffer.toString("base64");

    // Call the Shanjian AI voice clone API
    const client = getShanJianClient();
    const result = await client.voiceClone({
      voiceName: voiceNameStr,
      audioBase64: base64Data,
      model,
    });

    // Save the relative path for storage
    const savedFilePath = `/uploads/${filename}`;

    // Save a record in the database
    const voice = await createVoice(
      voiceNameStr,
      model,
      savedFilePath,
      result.taskId,
    );

    return NextResponse.json({
      success: true,
      voiceId: voice.id,
      taskId: result.taskId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
