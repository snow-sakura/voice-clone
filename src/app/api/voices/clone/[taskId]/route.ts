import { NextResponse } from "next/server";
import { getShanJianClient } from "../../../../../lib/shanjian";
import { handleApiError } from "../../../../../lib/api-helpers";
import { getVoiceByTaskId, updateVoiceOnComplete, updateVoiceOnFail } from "../../../../../db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
): Promise<NextResponse> {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing required parameter: taskId" },
        { status: 400 },
      );
    }

    const client = getShanJianClient();
    const result = await client.getTaskInfo(taskId);

    const status = result.status?.toLowerCase();
    const voice = await getVoiceByTaskId(taskId);

    if (voice) {
      if (status === "succeed" && result.result?.speakerId) {
        await updateVoiceOnComplete(
          voice.id,
          result.result.speakerId,
          result.result.demoAudioUrl ?? "",
        );
      } else if (status === "failed" || status === "error") {
        await updateVoiceOnFail(voice.id, "任务执行失败");
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
