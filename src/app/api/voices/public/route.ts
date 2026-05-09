import { NextResponse } from "next/server";
import { PRESET_VOICES } from "../../../../lib/preset-voices";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(PRESET_VOICES);
}
