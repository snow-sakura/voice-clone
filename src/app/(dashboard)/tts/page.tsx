"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PRESET_VOICES } from "@/lib/preset-voices";

// ── Types ──

interface VoiceOption {
  id: string;
  voiceId: string;
  name: string;
  source: "cloned" | "preset";
  description?: string;
  status?: string;
}

interface SubtitleItem {
  text: string;
  startMs: number;
  endMs: number;
}

// ── Helpers ──

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ── 预设音色元数据（从 preset-voices.ts 生成映射） ──

const PRESET_META: Record<string, string> = Object.fromEntries(
  PRESET_VOICES.map((v) => [v.voice_id, v.description])
);

// ── Component ──

export default function TtsPage() {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<SubtitleItem[] | null>(null);

  const selectedVoice = voices.find((v) => v.voiceId === selectedVoiceId);

  // ── Fetch voices ──

  useEffect(() => {
    let cancelled = false;
    async function fetchVoices() {
      setVoicesLoading(true);
      const options: VoiceOption[] = [];

      // Preset voices (from /api/voices/public)
      try {
        const res = await fetch("/api/voices/public");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const v of data) {
              if (v.voice_id) {
                options.push({
                  id: `preset-${v.voice_id}`,
                  voiceId: v.voice_id,
                  name: v.name || "预设音色",
                  source: "preset" as const,
                  description: PRESET_META[v.voice_id] ?? undefined,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("获取预设音色失败:", err);
      }

      // Cloned voices
      try {
        const res = await fetch("/api/voices?tab=cloned&pageSize=100");
        if (res.ok) {
          const data = await res.json();
          const items = data?.items ?? [];
          if (Array.isArray(items)) {
            for (const v of items) {
              if (v.voiceId && v.status === "completed") {
                options.push({
                  id: `cloned-${v.voiceId}`,
                  voiceId: v.voiceId,
                  name: v.name || "未命名音色",
                  source: "cloned" as const,
                  status: v.status,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("获取已克隆音色失败:", err);
      }

      if (!cancelled) {
        setVoices(options);
        if (options.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(options[0].voiceId);
        }
        setVoicesLoading(false);
      }
    }
    fetchVoices();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selectedVoiceId) return;

    setIsGenerating(true);
    setAudioUrl(null);
    setSubtitle(null);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text.trim(), voice: selectedVoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "语音生成失败");
      if (!data.audioUrl) throw new Error("API 未返回音频地址");

      setAudioUrl(data.audioUrl as string);
      if (Array.isArray(data.subtitle) && data.subtitle.length > 0) {
        setSubtitle(data.subtitle as SubtitleItem[]);
      }
      toast.success("语音生成成功");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const canSubmit = text.trim().length > 0 && selectedVoiceId !== "" && !isGenerating;

  // ── Render ──

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">文本转语音</h1>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
            选择音色，输入文本，一键生成高质量语音
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Voice selector sidebar ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="size-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                选择音色
              </h2>

              {voicesLoading ? (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-4">
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  加载音色列表...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                  {/* Preset group */}
                  {voices.filter((v) => v.source === "preset").length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5">
                        预设音色
                      </p>
                      {voices
                        .filter((v) => v.source === "preset")
                        .map((voice) => (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => setSelectedVoiceId(voice.voiceId)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                              selectedVoiceId === voice.voiceId
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "hover:bg-muted/60 text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{voice.name}</span>
                              {selectedVoiceId === voice.voiceId && (
                                <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {voice.description && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{voice.description}</p>
                            )}
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Cloned group */}
                  {voices.filter((v) => v.source === "cloned").length > 0 && (
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1 mb-1.5 mt-3">
                        已克隆音色
                      </p>
                      {voices
                        .filter((v) => v.source === "cloned")
                        .map((voice) => (
                          <button
                            key={voice.id}
                            type="button"
                            onClick={() => setSelectedVoiceId(voice.voiceId)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                              selectedVoiceId === voice.voiceId
                                ? "bg-primary/10 text-primary font-medium shadow-sm"
                                : "hover:bg-muted/60 text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{voice.name}</span>
                              {selectedVoiceId === voice.voiceId && (
                                <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected voice info */}
              {selectedVoice && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-medium ${
                      selectedVoice.source === "preset"
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                        : "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                    }`}>
                      {selectedVoice.source === "preset" ? "预设" : "已克隆"}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">{selectedVoice.name}</span>
                  </div>
                  {selectedVoice.description && (
                    <p className="text-xs text-muted-foreground mt-1.5">{selectedVoice.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Main form ── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              {/* Text input */}
              <div>
                <label htmlFor="text" className="block text-sm font-medium text-foreground mb-2">
                  输入文本
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="请输入要合成的文本内容..."
                  rows={8}
                  className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-shadow"
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{text.length} 字</p>
                  {text.length > 200 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      较长文本可能需要更多生成时间
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button type="submit" disabled={!canSubmit} className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary/20">
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : (
                  "生成语音"
                )}
              </Button>
            </form>

            {/* ── Result ── */}
            {audioUrl && (
              <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg className="size-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  生成结果
                </h2>

                <audio controls src={audioUrl} className="w-full h-10 rounded-lg mb-4" />

                <a
                  href={audioUrl}
                  download={audioUrl.split("/").pop() ?? "audio.mp3"}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  下载音频
                </a>

                {subtitle && subtitle.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">字幕</h3>
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
                      {subtitle.map((item, index) => (
                        <p key={index} className="text-sm text-foreground/80 leading-relaxed">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatTimestamp(item.startMs)} &ndash; {formatTimestamp(item.endMs)}
                          </span>
                          {" "}{item.text}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
