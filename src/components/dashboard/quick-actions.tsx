"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Types ──

interface QuickActionsProps {
  className?: string;
}

// ── Component ──

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        className
      )}
    >
      {/* 标题 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">快速操作</h3>
        <p className="text-xs text-muted-foreground mt-0.5">开始你的语音之旅</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 快速克隆 */}
        <Link
          href="/clone"
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-primary via-primary to-purple-600 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          <span className="font-medium">快速克隆</span>
        </Link>

        {/* 快速 TTS */}
        <Link
          href="/tts"
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-medium">快速 TTS</span>
        </Link>

        {/* 音色库 */}
        <Link
          href="/library"
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-muted-foreground text-sm font-medium hover:bg-muted/50 hover:text-foreground transition-colors"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span className="font-medium">音色库</span>
        </Link>
      </div>
    </div>
  );
}
