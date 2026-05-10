import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 公开路由（无需登录即可访问）
const publicRoutes = [
  '/login',
  '/register',
];

// 公开 API 路由前缀
const publicApiPrefixes = [
  '/api/auth',
  '/api/files', // 文件访问有自己的认证
];

/**
 * 检查路径是否为公开路由
 */
function isPublicRoute(pathname: string): boolean {
  // 检查公开页面
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // 检查公开 API 路由
  if (publicApiPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  // 静态资源
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // 图片、CSS、JS 等静态文件
  ) {
    return true;
  }

  return false;
}

/**
 * 添加安全响应头
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 防止 MIME 类型嗅探
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // 防止点击劫持
  response.headers.set('X-Frame-Options', 'DENY');
  // XSS 保护
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // 引用策略
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // 权限策略
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由直接放行
  if (isPublicRoute(pathname)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // 检查 session token
  const token = request.cookies.get('session_token')?.value;

  // 未登录，重定向到登录页
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    // 保存原始请求路径，登录后跳转回来
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }

  // 已登录，继续请求
  // 注意：session 验证在 API 路由和页面组件中进行
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (图标)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
