import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth";
import { existsSync } from "fs";

const TTS_OUTPUT_DIR = join(process.cwd(), "tts_output");

// 允许的文件扩展名和对应的 MIME 类型
const ALLOWED_TYPES: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
};

/**
 * 安全地提供 TTS 输出文件访问
 * GET /api/files/tts/[path]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { path: pathParts } = await params;
    const filePath = pathParts.join("/");

    // 安全检查：防止路径遍历攻击
    if (filePath.includes("..") || filePath.includes("\\")) {
      return NextResponse.json({ error: "无效的文件路径" }, { status: 400 });
    }

    // 提取文件扩展名
    const extension = filePath.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_TYPES[extension]) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    const fullPath = join(TTS_OUTPUT_DIR, filePath);

    // 确保路径在允许的目录内
    if (!fullPath.startsWith(TTS_OUTPUT_DIR)) {
      return NextResponse.json({ error: "访问被拒绝" }, { status: 403 });
    }

    // 检查文件是否存在
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 读取文件
    const fileBuffer = await readFile(fullPath);
    const mimeType = ALLOWED_TYPES[extension];

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("文件访问错误:", error);
    return NextResponse.json({ error: "文件访问失败" }, { status: 500 });
  }
}
