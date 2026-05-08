import { NextResponse } from "next/server";

// Zhipu AI preset voice list
const PRESET_VOICES = [
  { voice_id: "tongtong", name: "彤彤", description: "女声，温柔自然" },
  { voice_id: "chuichui", name: "锤锤", description: "男声，沉稳大气" },
  { voice_id: "xiaochen", name: "小陈", description: "男声，年轻活力" },
  { voice_id: "xiaoxiao", name: "小小", description: "女声，活泼可爱" },
  { voice_id: "xiaomo", name: "小墨", description: "男声，沉稳磁性" },
  { voice_id: "xiaobei", name: "小贝", description: "女声，知性优雅" },
  { voice_id: "xiaoxuan", name: "小轩", description: "男声，阳光帅气" },
];

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(PRESET_VOICES);
}
