import { NextRequest, NextResponse } from "next/server";
import { getVoices, getVoicesPaginated } from "../../../db/queries";
import { handleApiError } from "../../../lib/api-helpers";
import { PRESET_VOICES } from "../../../lib/preset-voices";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const tab = searchParams.get("tab") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10) || 12));

    if (tab === "preset") {
      // 预设音色不需要分页（共7个）
      return NextResponse.json({
        items: PRESET_VOICES.map((v) => ({
          id: null,
          name: v.name,
          voiceId: v.voice_id,
          description: v.description,
          source: "preset" as const,
          status: null,
          demoAudioUrl: null,
          createdAt: null,
        })),
        total: PRESET_VOICES.length,
        page: 1,
        pageSize: PRESET_VOICES.length,
        totalPages: 1,
      });
    }

    if (tab === "cloned") {
      const { items: voices, total } = await getVoicesPaginated(page, pageSize);
      return NextResponse.json({
        items: voices.map((v) => ({
          id: v.id,
          name: v.name,
          voiceId: v.voice_id,
          description: null,
          source: "cloned" as const,
          status: v.status,
          demoAudioUrl: v.demo_audio_url,
          createdAt: v.created_at,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    // tab === "all" — 预设在前，克隆在后，合并返回
    const [{ items: clonedVoices, total: clonedTotal }] = await Promise.all([
      getVoicesPaginated(page, pageSize),
    ]);

    const presetItems = PRESET_VOICES.map((v) => ({
      id: null,
      name: v.name,
      voiceId: v.voice_id,
      description: v.description,
      source: "preset" as const,
      status: null,
      demoAudioUrl: null,
      createdAt: null,
    }));

    const clonedItems = clonedVoices.map((v) => ({
      id: v.id,
      name: v.name,
      voiceId: v.voice_id,
      description: null,
      source: "cloned" as const,
      status: v.status,
      demoAudioUrl: v.demo_audio_url,
      createdAt: v.created_at,
    }));

    // 第1页：预设+克隆混合；后续页：仅克隆
    const items = page === 1 ? [...presetItems, ...clonedItems] : clonedItems;
    const total = PRESET_VOICES.length + clonedTotal;

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
