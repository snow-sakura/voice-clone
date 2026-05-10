import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { getDashScopeClient } from "@/lib/dashscope";
import { createVoice, updateVoiceOnComplete, updateVoiceOnFail, createActivity } from "@/db/queries";
import { handleApiError } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { getUploadsPath, getUploadsApiPath } from "@/lib/audio-helpers";

// 允许的文件类型配置
const ALLOWED_CONFIG = {
  extensions: ["wav", "mp3"] as const,
  mimeTypes: {
    wav: "audio/wav",
    mp3: "audio/mpeg",
  } as const,
  maxFileSize: 15 * 1024 * 1024, // 15MB
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();

    const audio = formData.get("audio");
    const voiceName = formData.get("voiceName");

    // 验证必填字段
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "缺少音频文件" },
        { status: 400 },
      );
    }
    if (!voiceName || !voiceName.toString().trim()) {
      return NextResponse.json(
        { error: "缺少音色名称" },
        { status: 400 },
      );
    }
    const voiceNameStr = voiceName.toString().trim();

    // 验证文件扩展名（安全处理）
    const fileName = audio.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    // 安全检查：扩展名必须只包含字母数字
    if (!extension || !/^[a-z0-9]+$/i.test(extension)) {
      return NextResponse.json(
        { error: "无效的文件扩展名" },
        { status: 400 },
      );
    }
    if (!ALLOWED_CONFIG.extensions.includes(extension as "wav" | "mp3")) {
      return NextResponse.json(
        { error: `不支持的音频格式: ${extension}。支持: ${ALLOWED_CONFIG.extensions.join(", ")}` },
        { status: 400 },
      );
    }

    // 验证 MIME 类型
    const allowedMimeTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3"];
    if (audio.type && !allowedMimeTypes.includes(audio.type)) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${audio.type}` },
        { status: 400 },
      );
    }

    // 验证文件大小
    if (audio.size > ALLOWED_CONFIG.maxFileSize) {
      return NextResponse.json(
        { error: `文件过大: ${(audio.size / 1024 / 1024).toFixed(1)}MB。最大: 15MB` },
        { status: 400 },
      );
    }

    // 确保上传目录存在
    const uploadsDir = getUploadsPath("");
    await mkdir(uploadsDir, { recursive: true });

    // 使用 UUID 生成安全的文件名
    const filename = `voice-${randomUUID()}.${extension}`;
    const filePath = getUploadsPath(filename);

    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, buffer);

    // 存储安全的 API 访问路径
    const savedFilePath = getUploadsApiPath(filename);

    // 获取 MIME 类型
    const mimeType = ALLOWED_CONFIG.mimeTypes[extension as keyof typeof ALLOWED_CONFIG.mimeTypes] ?? "audio/wav";

    // 保存初始数据库记录（状态: "pending"）
    const dbVoice = await createVoice(voiceNameStr, "qwen-voice-enrollment", savedFilePath, user.id);

    // 调用 DashScope API 进行音色克隆
    try {
      const client = getDashScopeClient();
      const audioBase64 = buffer.toString("base64");

      const cloneResult = await client.voiceClone({
        voiceName: voiceNameStr,
        audioBase64,
        audioMimeType: mimeType,
      });

      console.log("[clone] DashScope clone result:", JSON.stringify(cloneResult, null, 2));

      // 更新数据库状态为完成
      await updateVoiceOnComplete(dbVoice.id, cloneResult.voiceId, cloneResult.previewAudioUrl ?? "");

      // 记录活动
      await createActivity(user.id, "clone", `克隆音色「${voiceNameStr}」`, {
        voiceId: dbVoice.id,
        apiVoiceId: cloneResult.voiceId,
      });

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
