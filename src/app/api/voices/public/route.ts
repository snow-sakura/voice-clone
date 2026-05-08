import { NextResponse } from "next/server";
import { getShanJianClient } from "../../../../lib/shanjian";
import { handleApiError } from "../../../../lib/api-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const client = getShanJianClient();
    const result = await client.getPublicVoices();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
