import { NextResponse } from "next/server";
import { deleteVoice, getVoiceById } from "@/db/queries";
import { handleApiError } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const voiceId = Number(id);
    if (isNaN(voiceId)) {
      return NextResponse.json(
        { error: "无效的音色 ID" },
        { status: 400 },
      );
    }

    // 验证音色所有权
    const voice = await getVoiceById(voiceId);
    if (!voice) {
      return NextResponse.json(
        { error: "音色不存在" },
        { status: 404 },
      );
    }

    // 允许删除自己的音色或无主音色（兼容旧数据）
    if (voice.user_id !== null && voice.user_id !== user.id) {
      return NextResponse.json(
        { error: "无权删除此音色" },
        { status: 403 },
      );
    }

    const deletedVoice = await deleteVoice(voiceId);

    if (!deletedVoice) {
      return NextResponse.json(
        { error: "删除失败" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
