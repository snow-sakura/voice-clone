/**
 * 简单的内存速率限制器
 * 注意：在生产环境中应使用 Redis 等分布式存储
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 存储结构: key -> { count, resetAt }
const store = new Map<string, RateLimitEntry>();

// 清理过期条目（每 5 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 最大请求次数 */
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * 检查速率限制
 * @param key 标识符（如 IP 地址或用户 ID）
 * @param config 配置
 * @returns 限制结果
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 创建新条目
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // 超过限制
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // 增加计数
  entry.count++;
  store.set(key, entry);

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * 重置速率限制计数
 * @param key 标识符
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * 获取客户端标识符（IP 地址）
 */
export function getClientIdentifier(request: Request): string {
  // 尝试从各种头部获取真实 IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 回退到一个默认值（本地开发）
  return 'unknown';
}

// 预定义的速率限制配置
export const RATE_LIMITS = {
  // 登录：5 分钟内最多 5 次失败
  login: { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  // 注册：1 小时内最多 3 次
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  // TTS：1 分钟内最多 10 次
  tts: { windowMs: 60 * 1000, maxRequests: 10 },
  // 克隆：1 小时内最多 20 次
  clone: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
} as const;
