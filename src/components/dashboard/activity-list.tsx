"use client";

import { cn } from "@/lib/utils";

// ── Types ──

export interface Activity {
  id: number;
  type: "clone" | "tts" | "delete_voice" | "login" | "register";
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ActivityListProps {
  activities: Activity[];
  className?: string;
}

// ── Constants ──

const ACTIVITY_CONFIG: Record<
  Activity["type"],
  { icon: React.ReactNode; label: string; colorClass: string }
> = {
  clone: {
    icon: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    label: "音色克隆",
    colorClass: "text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
  },
  tts: {
    icon: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    label: "语音合成",
    colorClass: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  },
  delete_voice: {
    icon: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    label: "删除音色",
    colorClass: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
  },
  login: {
    icon: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
    ),
    label: "登录",
    colorClass: "text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  },
  register: {
    icon: (
      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    label: "注册",
    colorClass: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
  },
};

// ── Helpers ──

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;

    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ── Sub-components ──

function ActivityItem({ activity }: { activity: Activity }) {
  const config = ACTIVITY_CONFIG[activity.type];

  return (
    <div className="group flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50">
      {/* 图标 */}
      <div
        className={cn(
          "flex items-center justify-center size-8 rounded-lg shrink-0",
          config.colorClass
        )}
      >
        {config.icon}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
      <svg className="size-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm font-medium text-muted-foreground">暂无活动记录</p>
      <p className="text-xs text-muted-foreground/60 mt-1">操作记录将显示在这里</p>
    </div>
  );
}

// ── Main Component ──

export function ActivityList({ activities, className }: ActivityListProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        className
      )}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">最近活动</h3>
        {activities.length > 0 && (
          <span className="text-xs text-muted-foreground">{activities.length} 条记录</span>
        )}
      </div>

      {/* 内容 */}
      {activities.length > 0 ? (
        <div className="divide-y divide-border/50">
          {activities.slice(0, 10).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
