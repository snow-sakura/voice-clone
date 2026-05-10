import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/context';
import { getClearSessionCookieConfig } from '@/lib/auth/cookie';
import { handleApiError } from '@/lib/api-helpers';

export async function POST() {
  try {
    // 清除会话
    await clearSession();

    // 清除 cookie
    const cookieConfig = getClearSessionCookieConfig();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
