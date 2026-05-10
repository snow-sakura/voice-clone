import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/context';
import { handleApiError } from '@/lib/api-helpers';
import {
  getVoiceCountByUserId,
  getCompletedVoiceCountByUserId,
  getTodayTtsCount,
} from '@/db/queries';

/**
 * GET /api/stats
 * 获取当前用户的统计数据
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 并行获取所有统计数据
    const [totalClones, totalVoices, todayTts] = await Promise.all([
      getVoiceCountByUserId(user.id),
      getCompletedVoiceCountByUserId(user.id),
      getTodayTtsCount(user.id),
    ]);

    // 计算成功率
    const successRate = totalClones > 0
      ? Math.round((totalVoices / totalClones) * 100)
      : 100;

    return NextResponse.json({
      totalClones,
      totalVoices,
      todayTts,
      successRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
