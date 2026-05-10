"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

// ── Types ──

type TabType = "all" | "cloned" | "preset";

export interface VoiceItem {
  id: number | null;
  name: string;
  voiceId: string | null;
  description: string | null;
  source: "cloned" | "preset";
  status: string | null;
  demoAudioUrl: string | null;
  createdAt: string | null;
}

interface PageData {
  items: VoiceItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Constants ──

const PAGE_SIZE = 12;

const TABS: { key: TabType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "cloned", label: "已克隆" },
  { key: "preset", label: "预设" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "处理中",
    className:
      "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  completed: {
    label: "已完成",
    className:
      "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  failed: {
    label: "失败",
    className:
      "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

// ── Helpers ──

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ── Sub-components ──

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-16 rounded-md bg-muted" />
        <div className="h-4 w-20 rounded-md bg-muted" />
      </div>
      <div className="h-3 w-36 rounded-md bg-muted/70 mb-3" />
      <div className="h-8 rounded-lg bg-muted/50" />
    </div>
  );
}

function EmptyState({ tab }: { tab: TabType }) {
  const config: Record<TabType, { icon: React.ReactNode; title: string; desc: string }> = {
    all: {
      icon: (
        <svg className="size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: "暂无音色",
      desc: "上传音频开始克隆你的第一个音色",
    },
    cloned: {
      icon: (
        <svg className="size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      title: "暂无已克隆音色",
      desc: "上传参考音频开始克隆吧",
    },
    preset: {
      icon: (
        <svg className="size-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "暂无预设音色",
      desc: "预设音色暂不可用",
    },
  };

  const { icon, title, desc } = config[tab];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
      <div className="mb-4">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">{desc}</p>
    </div>
  );
}

function VoiceCard({
  item,
  onDelete,
  deleting,
}: {
  item: VoiceItem;
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.voiceId) return;
    await navigator.clipboard.writeText(item.voiceId);
    setCopied(true);
    toast.success("已复制音色ID");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/3 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
          <span
            className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
              item.source === "preset"
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
            }`}
          >
            {item.source === "preset" ? "预设" : "已克隆"}
          </span>
          {item.status && (
            <span
              className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_CONFIG[item.status]?.className ?? ""}`}
            >
              {STATUS_CONFIG[item.status]?.label ?? item.status}
            </span>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.description}</p>
      )}

      {/* Voice ID */}
      {item.voiceId && (
        <div className="flex items-center gap-1.5 mb-3">
          <code className="text-[11px] font-mono text-muted-foreground truncate">{item.voiceId}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors"
            title="复制音色ID"
          >
            {copied ? (
              <svg className="size-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Audio player */}
      {item.demoAudioUrl && (
        <div className="mb-3">
          <audio controls src={item.demoAudioUrl} className="w-full h-8 rounded-lg" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground/60">{formatDate(item.createdAt)}</span>
        {item.source === "cloned" && item.id !== null && (
          <button
            type="button"
            onClick={() => onDelete(item.id!)}
            disabled={deleting}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-destructive disabled:opacity-50 transition-colors"
          >
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        上一页
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        {page} <span className="text-muted-foreground/40">/</span> {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        下一页
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
}

// ── Main Component ──

export function VoiceList() {
  const [tab, setTab] = useState<TabType>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // 用于强制刷新

  // 使用 ref 跟踪组件挂载状态，避免在卸载后更新状态
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchVoices() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ tab, page: String(page), pageSize: String(PAGE_SIZE) });
        const res = await fetch(`/api/voices?${params}`);
        if (!res.ok) throw new Error("获取音色列表失败");
        const json = await res.json();
        if (!cancelled && isMountedRef.current) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          toast.error(err instanceof Error ? err.message : "获取音色列表失败");
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    }

    fetchVoices();

    return () => {
      cancelled = true;
    };
  }, [tab, page, refreshKey]);

  const handleTabChange = (t: TabType) => {
    setTab(t);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/voices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "删除失败");
      }
      toast.success("音色已删除");
      if (data && data.items.length <= 1 && page > 1) {
        setPage(page - 1);
      } else {
        // 强制刷新数据
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">可用音色</h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理你的已克隆音色和预设音色
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((item, i) => (
              <VoiceCard
                key={item.source === "cloned" && item.id ? `cloned-${item.id}` : `preset-${item.voiceId}-${i}`}
                item={item}
                onDelete={handleDelete}
                deleting={deleting === item.id}
              />
            ))}
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />

          <p className="mt-6 text-center text-xs text-muted-foreground/50">共 {data.total} 个音色</p>
        </>
      ) : (
        <EmptyState tab={tab} />
      )}
    </div>
  );
}
