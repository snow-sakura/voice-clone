import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { SESSION_EXPIRY_DAYS } from './session';

/**
 * Session cookie 配置
 */
export const SESSION_COOKIE_NAME = 'session_token';

/**
 * 获取 session cookie 配置
 * @param token session token
 * @returns cookie 配置对象
 */
export function getSessionCookieConfig(token: string): {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 7 天（秒）
    },
  };
}

/**
 * 获取清除 session cookie 的配置
 * @returns cookie 配置对象
 */
export function getClearSessionCookieConfig(): {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // 立即过期
    },
  };
}
