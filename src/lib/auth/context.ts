import { cookies } from 'next/headers';
import { getSession, deleteSession } from './session';

/**
 * 从请求中获取当前登录用户
 * @returns 用户信息，如果未登录则返回 null
 */
export async function getCurrentUser(): Promise<{
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    return null;
  }

  const result = await getSession(token);

  if (!result) {
    return null;
  }

  return result.user;
}

/**
 * 获取当前用户，如果未登录则抛出错误
 * @returns 用户信息
 * @throws 如果用户未登录
 */
export async function requireAuth(): Promise<{
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
}> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('未授权：请先登录');
  }

  return user;
}

/**
 * 清除当前用户的会话
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (token) {
    await deleteSession(token);
  }
}
