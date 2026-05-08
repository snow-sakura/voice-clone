import { NextResponse } from "next/server";
import { deleteVoice } from "../../../../db/queries";
import { handleApiError } from "../../../../lib/api-helpers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const voiceId = Number(id);
    if (isNaN(voiceId)) {
      return NextResponse.json(
        { error: "Invalid voice ID" },
        { status: 400 },
      );
    }

    const deletedVoice = await deleteVoice(voiceId);

    if (!deletedVoice) {
      return NextResponse.json(
        { error: "Voice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
