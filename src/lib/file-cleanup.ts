import { readdir, unlink, stat } from "fs/promises";
import { join } from "path";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7天
const TTS_DIR = join(process.cwd(), "tts_output");
const UPLOADS_DIR = join(process.cwd(), "uploads");

/**
 * 清理指定目录中超过 maxAgeMs 的旧文件
 */
export async function cleanupOldFiles(dir: string, maxAgeMs: number) {
  try {
    const files = await readdir(dir);
    const now = Date.now();
    for (const file of files) {
      // 跳过 .gitkeep 文件
      if (file === ".gitkeep") continue;
      const filePath = join(dir, file);
      try {
        const stats = await stat(filePath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await unlink(filePath);
          console.log(`[cleanup] Deleted old file: ${file}`);
        }
      } catch (err) {
        console.error(`[cleanup] Error processing ${file}:`, err);
      }
    }
  } catch {
    // 目录不存在则忽略
  }
}

/**
 * 清理孤立的临时文件（没有对应数据库记录的文件）
 * 通过检查文件修改时间来判断，超过 maxAgeMs 的直接删除
 */
export async function cleanupOrphanedFiles(dir: string, maxAgeMs: number) {
  // 与 cleanupOldFiles 类似，但保留更短的 maxAge 用于孤立文件
  // 孤立文件通常更早过期
  const orphanMaxAge = Math.min(maxAgeMs, 24 * 60 * 60 * 1000); // 最多1天
  try {
    const files = await readdir(dir);
    const now = Date.now();
    for (const file of files) {
      if (file === ".gitkeep") continue;
      const filePath = join(dir, file);
      try {
        const stats = await stat(filePath);
        if (now - stats.mtimeMs > orphanMaxAge) {
          await unlink(filePath);
          console.log(`[cleanup] Deleted orphaned file: ${file}`);
        }
      } catch (err) {
        console.error(`[cleanup] Error processing orphan ${file}:`, err);
      }
    }
  } catch {
    // 目录不存在则忽略
  }
}

/**
 * 启动时执行一次清理
 */
export function scheduleCleanup() {
  console.log("[cleanup] Starting scheduled file cleanup...");
  cleanupOldFiles(TTS_DIR, MAX_AGE_MS);
  cleanupOldFiles(UPLOADS_DIR, MAX_AGE_MS);
  console.log("[cleanup] Cleanup scheduled (running in background).");
}
