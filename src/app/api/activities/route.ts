import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/context';
import { handleApiError } from '@/lib/api-helpers';
import {
  getActivitiesByUserId,
  getActivityCountByUserId,
} from '@/db/queries';

/**
 * GET /api/activities?limit=20
 * 获取当前用户的活动列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 获取 limit 参数，默认 20
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 20;

    // 并行获取活动列表和总数
    const [items, total] = await Promise.all([
      getActivitiesByUserId(user.id, limit),
      getActivityCountByUserId(user.id),
    ]);

    // 格式化返回数据
    const formattedItems = items.map((item) => ({
      id: item.id,
      type: item.type,
      description: item.description,
      metadata: item.metadata,
      createdAt: item.created_at,
    }));

    return NextResponse.json({
      items: formattedItems,
      total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
