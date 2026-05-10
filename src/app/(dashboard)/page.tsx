import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/context";
import {
  CloneStatCard,
  VoiceStatCard,
  TTSStatCard,
  SuccessRateCard,
  ActivityList,
  QuickActions,
  type Activity,
} from "@/components/dashboard";
import {
  getVoiceCountByUserId,
  getCompletedVoiceCountByUserId,
  getTodayTtsCount,
  getActivitiesByUserId,
} from "@/db/queries";

// ── 页面组件 ──

export default async function DashboardPage() {
  // 获取当前用户
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 直接查询数据库，不再通过 HTTP 调用自己的 API
  const [totalClones, totalVoices, todayTts, rawActivities] = await Promise.all([
    getVoiceCountByUserId(user.id),
    getCompletedVoiceCountByUserId(user.id),
    getTodayTtsCount(user.id),
    getActivitiesByUserId(user.id, 10),
  ]);

  // 计算成功率
  const successRate = totalClones > 0
    ? Math.round((totalVoices / totalClones) * 100)
    : 100;

  const stats = { totalClones, totalVoices, todayTts, successRate };

  // 格式化活动数据（DB snake_case → 组件 camelCase）
  const activities: Activity[] = rawActivities.map((item) => ({
    id: item.id,
    type: item.type as Activity["type"],
    description: item.description,
    metadata: item.metadata,
    createdAt: item.created_at,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* 欢迎标题 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">工作台</h1>
        <p className="text-muted-foreground mt-1">
          欢迎回来，{user.name || user.email}，开始您的语音创作之旅
        </p>
      </div>

      {/* 统计卡片区 - 4 个卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CloneStatCard
          title="克隆总数"
          value={stats.totalClones}
          trend={stats.totalClones > 0 ? "+1 本周" : undefined}
        />
        <VoiceStatCard
          title="可用音色"
          value={stats.totalVoices}
          trend={stats.totalVoices > 0 ? "全部可用" : undefined}
        />
        <TTSStatCard
          title="今日合成"
          value={stats.todayTts}
          trend={stats.todayTts > 0 ? `共 ${stats.todayTts} 次` : undefined}
        />
        <SuccessRateCard
          title="成功率"
          value={stats.successRate}
          trend={stats.successRate === 100 ? "完美" : undefined}
        />
      </div>

      {/* 快速操作 */}
      <QuickActions />

      {/* 最近活动 */}
      <ActivityList activities={activities} />
    </div>
  );
}
