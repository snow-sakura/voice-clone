import { NextResponse } from "next/server";
import { getShanJianClient } from "../../../../lib/shanjian";
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

    // Delete from DB (returns the deleted record so we can get the speaker_id)
    const deletedVoice = await deleteVoice(voiceId);

    // If the voice has a speaker_id, also delete the asset on Shanjian
    if (deletedVoice?.speaker_id) {
      try {
        const client = getShanJianClient();
        await client.deleteAsset(deletedVoice.speaker_id);
      } catch {
        // Log but don't fail — the DB record is already deleted
        console.error(
          `Failed to delete Shanjian asset ${deletedVoice.speaker_id} for voice ${voiceId}`,
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
