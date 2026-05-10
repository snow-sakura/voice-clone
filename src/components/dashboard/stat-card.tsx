"use client";

import { cn } from "@/lib/utils";

// ── Types ──

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
}

// ── Component ──

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300",
        "hover:shadow-lg hover:shadow-foreground/3 hover:-translate-y-0.5",
        className
      )}
    >
      {/* 背景渐变装饰 */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="relative flex items-start justify-between">
        {/* 左侧内容 */}
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-2 flex items-center gap-1">
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {trend}
            </p>
          )}
        </div>

        {/* 右侧图标 */}
        <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── 预设样式变体 ──

interface StatCardVariantProps {
  title: string;
  value: string | number;
  trend?: string;
}

export function CloneStatCard({ title, value, trend }: StatCardVariantProps) {
  return (
    <StatCard
      title={title}
      value={value}
      trend={trend}
      icon={
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      }
    />
  );
}

export function VoiceStatCard({ title, value, trend }: StatCardVariantProps) {
  return (
    <StatCard
      title={title}
      value={value}
      trend={trend}
      icon={
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      }
    />
  );
}

export function TTSStatCard({ title, value, trend }: StatCardVariantProps) {
  return (
    <StatCard
      title={title}
      value={value}
      trend={trend}
      icon={
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      }
    />
  );
}

export function SuccessRateCard({ title, value, trend }: StatCardVariantProps) {
  return (
    <StatCard
      title={title}
      value={typeof value === "number" ? `${value}%` : value}
      trend={trend}
      icon={
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );
}
