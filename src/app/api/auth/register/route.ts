import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { getSessionCookieConfig } from '@/lib/auth/cookie';
import { createUser, getUserByEmail, createActivity } from '@/db/queries';
import { handleApiError } from '@/lib/api-helpers';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientId = getClientIdentifier(request);
    const rateLimitKey = `register:${clientId}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.register);

    if (!rateLimitResult.success) {
      const waitMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `注册请求过于频繁，请 ${waitMinutes} 分钟后再试` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // 参数校验
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码为必填项' },
        { status: 400 }
      );
    }

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 密码长度校验
    if (password.length < 8) {
      return NextResponse.json(
        { error: '密码长度至少为 8 位' },
        { status: 400 }
      );
    }

    // 密码复杂度校验
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: '密码必须包含字母和数字' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const user = await createUser(email, passwordHash, name);

    // 创建会话
    const token = await createSession(user.id);

    // 记录注册活动
    await createActivity(user.id, 'register', '用户注册成功');

    // 设置 cookie
    const cookieConfig = getSessionCookieConfig(token);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
    response.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig.options);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
