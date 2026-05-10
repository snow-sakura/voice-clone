import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/context';
import { handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
