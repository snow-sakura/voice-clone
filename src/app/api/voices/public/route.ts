import { NextResponse } from "next/server";

// Qwen3-TTS preset voice list (compatible with qwen3-tts-vc-2026-01-22)
const PRESET_VOICES = [
  { voice_id: "Cherry", name: "Cherry", description: "English female, natural and warm" },
  { voice_id: "xiaoyun", name: "小云", description: "女声，温柔自然" },
  { voice_id: "xiaogang", name: "小刚", description: "男声，沉稳大气" },
  { voice_id: "ruoxi", name: "若兮", description: "女声，知性优雅" },
  { voice_id: "siyue", name: "四月", description: "女声，活泼可爱" },
  { voice_id: "ailun", name: "艾伦", description: "男声，阳光帅气" },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(PRESET_VOICES);
}
