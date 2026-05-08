import { NextResponse } from "next/server";
import { ZhipuError } from "./zhipu";

/**
 * Handle API errors consistently across all routes.
 * Returns a NextResponse with an appropriate HTTP status code and error message.
 */
export function handleApiError(error: unknown): NextResponse<{ error: string }> {
  if (error instanceof ZhipuError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

/**
 * Validate that all required fields are present and non-empty in the body.
 * Returns a NextResponse with 400 status if validation fails, or null if OK.
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[],
): NextResponse<{ error: string }> | null {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 },
      );
    }
  }
  return null;
}
