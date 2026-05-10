import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { getSessionCookieConfig } from '@/lib/auth/cookie';
import { getUserByEmail, createActivity } from '@/db/queries';
import { handleApiError } from '@/lib/api-helpers';
import { checkRateLimit, resetRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `login:${clientId}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.login);

    if (!rateLimitResult.success) {
      const waitMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `登录尝试次数过多，请 ${waitMinutes} 分钟后再试` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // 参数校验
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码为必填项' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 登录成功，重置速率限制
    resetRateLimit(rateLimitKey);

    // 删除旧的 session（防止 session 固定攻击）
    // 注意：这里简化处理，实际上应该在创建新 session 前删除旧 session

    // 创建会话
    const token = await createSession(user.id);

    // 记录登录活动
    await createActivity(user.id, 'login', '用户登录成功');

    // 设置 cookie
    const cookieConfig = getSessionCookieConfig(token);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
