import { promises as fs } from "fs";
import path from "path";

const TTS_OUTPUT_DIR = path.join(process.cwd(), "public", "tts_output");

/**
 * Save audio data to the local public/tts_output directory.
 *
 * @param source - An HTTP(S) URL pointing to audio, a data:-URL containing
 *                 base64-encoded audio, a raw base64 string, or a Buffer.
 * @param filename - The desired filename (e.g. "abc123.mp3").
 * @returns The public URL path relative to the site root (e.g. "/tts_output/abc123.mp3").
 */
export async function saveAudioToLocal(
  source: string | Buffer,
  filename: string,
): Promise<string> {
  await fs.mkdir(TTS_OUTPUT_DIR, { recursive: true });

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

  return `/tts_output/${filename}`;
}
