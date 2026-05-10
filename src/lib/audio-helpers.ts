import { promises as fs } from "fs";
import path from "path";

// 使用项目根目录下的安全存储路径（非 public）
const TTS_OUTPUT_DIR = path.join(process.cwd(), "tts_output");

/**
 * Save audio data to a secure directory (not publicly accessible).
 * Files are served through /api/files/tts/ with authentication.
 *
 * @param source - An HTTP(S) URL pointing to audio, a data:-URL containing
 *                 base64-encoded audio, a raw base64 string, or a Buffer.
 * @param filename - The desired filename (e.g. "abc123.wav").
 * @returns The API path to access the file (e.g. "/api/files/tts/abc123.wav").
 */
export async function saveAudioToLocal(
  source: string | Buffer,
  filename: string,
): Promise<string> {
  await fs.mkdir(TTS_OUTPUT_DIR, { recursive: true });

  // 安全验证：确保文件名不包含路径遍历字符
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid filename");
  }

  // 验证文件扩展名
  const extension = filename.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["wav", "mp3"];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file extension: ${extension}`);
  }

  const filePath = path.join(TTS_OUTPUT_DIR, filename);

  if (typeof source === "string") {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      // Fetch the audio from the remote URL
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(
          `Failed to download audio from URL (status ${response.status})`,
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    } else if (source.startsWith("data:")) {
      // Data URL format: data:[<mediatype>][;base64],<data>
      const base64Data = source.split(",")[1];
      if (!base64Data) {
        throw new Error("Invalid data URL: no base64 payload found");
      }
      const buffer = Buffer.from(base64Data, "base64");
      await fs.writeFile(filePath, buffer);
    } else {
      // Assume raw base64 string
      const buffer = Buffer.from(source, "base64");
      await fs.writeFile(filePath, buffer);
    }
  } else {
    // Already a Buffer
    await fs.writeFile(filePath, source);
  }

  // 返回 API 路径而非公开路径
  return `/api/files/tts/${filename}`;
}

/**
 * 获取上传文件的存储路径
 */
export function getUploadsPath(filename: string): string {
  // 安全验证
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid filename");
  }
  return path.join(process.cwd(), "uploads", filename);
}

/**
 * 获取上传文件的 API 访问路径
 */
export function getUploadsApiPath(filename: string): string {
  return `/api/files/uploads/${filename}`;
}
