import { NextResponse } from "next/server";
import { getVoices } from "../../../db/queries";
import { handleApiError } from "../../../lib/api-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const voices = await getVoices();
    return NextResponse.json(voices);
  } catch (error) {
    return handleApiError(error);
  }
}
