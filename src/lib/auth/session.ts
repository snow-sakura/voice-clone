import { randomBytes } from 'crypto';
import {
  createSession as dbCreateSession,
  getSessionByToken as dbGetSessionByToken,
  deleteSession as dbDeleteSession,
  getUserById,
} from '@/db/queries';

export const SESSION_EXPIRY_DAYS = 7;

/**
 * 生成随机 session token
 * @returns 32 字节的十六进制字符串
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * 计算会话过期时间
 * @returns ISO 格式的过期时间字符串
 */
export function calculateExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  return expiresAt.toISOString();
}

/**
 * 创建会话
 * @param userId 用户 ID
 * @returns session token
 */
export async function createSession(userId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = calculateExpiryDate();

  await dbCreateSession(userId, token, expiresAt);

  return token;
}

/**
 * 获取会话及关联的用户信息
 * @param token session token
 * @returns 会话和用户信息，如果会话无效或过期则返回 null
 */
export async function getSession(token: string): Promise<{
  session: { id: number; userId: number; expiresAt: string };
  user: { id: number; email: string; name: string | null; avatar: string | null };
} | null> {
  const session = await dbGetSessionByToken(token);

  if (!session) {
    return null;
  }

  // 检查会话是否过期
  if (new Date(session.expires_at) < new Date()) {
    // 删除过期会话
    await dbDeleteSession(token);
    return null;
  }

  const user = await getUserById(session.user_id);

  if (!user) {
    return null;
  }

  return {
    session: {
      id: session.id,
      userId: session.user_id,
      expiresAt: session.expires_at,
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  };
}

/**
 * 删除会话
 * @param token session token
 */
export async function deleteSession(token: string): Promise<void> {
  await dbDeleteSession(token);
}
