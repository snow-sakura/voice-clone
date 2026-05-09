"use client";

import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { VoiceList } from "../../components/voice-list";

// ── Types ──

type CloneState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "completed"; voiceId: number; apiVoiceId: string; demoAudioUrl: string; voiceName: string }
  | { phase: "error"; message: string };

// ── Constants ──

const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav"];
const ACCEPTED_EXTENSIONS = ".mp3,.wav";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const MIN_DURATION = 10;
const MAX_DURATION = 300;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

async function getAudioDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        resolve(Math.round(audio.duration));
      } else {
        resolve(null);
      }
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
  });
}

// ── Inline SVG icons ──

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function MusicNoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Component ──

export default function ClonePage() {
  const [state, setState] = useState<CloneState>({ phase: "idle" });
  const [voiceName, setVoiceName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [durationLoading, setDurationLoading] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/voices?tab=cloned&pageSize=100")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: unknown[] }) => {
        const names = new Set<string>();
        for (const v of data.items ?? []) {
          if (v && typeof v === "object" && typeof (v as Record<string, unknown>).name === "string") {
            names.add(((v as Record<string, unknown>).name as string).trim().toLowerCase());
          }
        }
        setExistingNames(names);
      })
      .catch(() => {});
  }, []);

  const trimmedName = voiceName.trim();
  const nameDuplicate = trimmedName.length > 0 && existingNames.has(trimmedName.toLowerCase());

  const suggestions: string[] = [];
  if (nameDuplicate) {
    for (let i = 1; i <= 5; i++) {
      const candidate = `${trimmedName}-${i}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        suggestions.push(candidate);
        if (suggestions.length >= 3) break;
      }
    }
    while (suggestions.length < 3) {
      const suffix = Math.random().toString(36).slice(2, 5);
      const candidate = `${trimmedName}-${suffix}`;
      if (!existingNames.has(candidate.toLowerCase())) {
        suggestions.push(candidate);
      }
    }
  }

  function validateFileTypeAndSize(file: File): string | null {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && file.type !== "") {
      return `不支持的音频格式，支持 ${ACCEPTED_EXTENSIONS}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  }

  async function handleFile(file: File) {
    setDurationError(null);
    const typeError = validateFileTypeAndSize(file);
    if (typeError) {
      toast.error(typeError);
      return;
    }
    setSelectedFile(file);
    setDuration(null);
    setDurationLoading(true);
    const dur = await getAudioDuration(file);
    setDurationLoading(false);
    if (dur === null) {
      setDuration(null);
      setDurationError("无法读取音频时长，请确认文件格式正确");
      return;
    }
    setDuration(dur);
    if (dur < MIN_DURATION) {
      setDurationError(`音频时长过短（${formatDuration(dur)}），需在 ${MIN_DURATION}~${MAX_DURATION} 秒之间`);
    } else if (dur > MAX_DURATION) {
      setDurationError(`音频时长过长（${formatDuration(dur)}），需在 ${MIN_DURATION}~${MAX_DURATION} 秒之间`);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setDuration(null);
    setDurationError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { toast.error("请选择音频文件"); return; }
    const fileError = validateFileTypeAndSize(selectedFile);
    if (fileError) { toast.error(fileError); return; }
    if (!trimmedName) { toast.error("请输入音色名称"); return; }
    if (nameDuplicate) { toast.error(`音色名称「${trimmedName}」已存在，请使用其他名称`); return; }
    if (durationError || duration === null || duration < MIN_DURATION || duration > MAX_DURATION) {
      toast.error(durationError || "音频时长不符合要求"); return;
    }

    setState({ phase: "submitting" });
    try {
      const formData = new FormData();
      formData.append("audio", selectedFile);
      formData.append("voiceName", trimmedName);
      const res = await fetch("/api/voices/clone", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `请求失败 (${res.status})`);
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "复刻失败");

      setState({
        phase: "completed",
        voiceId: data.voiceId,
        apiVoiceId: data.apiVoiceId,
        demoAudioUrl: data.demoAudioUrl,
        voiceName: trimmedName,
      });
      toast.success("音色复刻成功！");
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setState({ phase: "error", message });
      toast.error(message);
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: DragEvent) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (!target.contains(e.relatedTarget as Node)) setDragOver(false);
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleReset() {
    setState({ phase: "idle" });
    clearFile();
    setVoiceName("");
  }

  // ── Render ──

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-xl px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">音色复刻</h1>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
            基于阿里云百炼 Qwen3-TTS 模型，上传一段音频即可复刻专属音色
          </p>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">

          {/* ── Completed ── */}
          {state.phase === "completed" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircleIcon className="size-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">音色复刻成功</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.voiceName}</p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-5">
                {[
                  { label: "音色名称", value: state.voiceName },
                  { label: "音色ID", value: state.apiVoiceId, mono: true },
                  { label: "本地ID", value: String(state.voiceId), mono: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground shrink-0">{row.label}</span>
                    <span className={`text-sm font-medium text-foreground text-right truncate ${row.mono ? "font-mono" : ""}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {state.demoAudioUrl && (
                <div className="space-y-2.5">
                  <p className="text-sm font-medium text-foreground">试听音频</p>
                  <audio controls src={state.demoAudioUrl} className="w-full h-10 rounded-lg" />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">继续复刻</Button>
                <Button
                  onClick={() => { navigator.clipboard.writeText(state.apiVoiceId); toast.success("已复制音色ID"); }}
                  className="flex-1"
                >
                  复制音色ID
                </Button>
              </div>
            </div>
          )}

          {/* ── Submitting ── */}
          {state.phase === "submitting" && (
            <div className="flex flex-col items-center gap-5 py-14">
              <div className="relative">
                <div className="size-16 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 size-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">正在复刻音色</p>
                <p className="text-xs text-muted-foreground mt-1">AI 正在学习声音特征，请稍候...</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {state.phase === "error" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <XCircleIcon className="size-6 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">复刻失败</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{state.message}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleReset} className="w-full">重新尝试</Button>
            </div>
          )}

          {/* ── Idle form ── */}
          {(state.phase === "idle" || state.phase === "error") && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : selectedFile
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS} onChange={handleFileSelect} className="hidden" />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <MusicNoteIcon className="size-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(selectedFile.size)}
                        {durationLoading && <span> &mdash; 读取时长中...</span>}
                        {duration !== null && <span> &mdash; {formatDuration(duration)}</span>}
                      </p>
                      {durationError && <p className="text-xs text-red-500 mt-1">{durationError}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`flex size-14 items-center justify-center rounded-2xl transition-colors ${
                      dragOver ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <UploadIcon className="size-7" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-semibold text-primary">点击上传</span> 或拖拽音频文件到此处
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        支持 {ACCEPTED_EXTENSIONS}，{MIN_DURATION}~{MAX_DURATION} 秒，最大 {formatFileSize(MAX_FILE_SIZE)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Voice name */}
              <div>
                <label htmlFor="voiceName" className="block text-sm font-medium text-foreground mb-2">
                  音色名称 <span className="text-red-400">*</span>
                </label>
                <input
                  id="voiceName"
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="为音色取一个名字，如：我的声音"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 transition-shadow ${
                    nameDuplicate
                      ? "border-red-300 dark:border-red-700 focus:ring-red-500/20"
                      : "border-border focus:ring-primary/20 focus:border-primary/50"
                  }`}
                />
                {nameDuplicate && (
                  <div className="mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-800 space-y-2.5">
                    <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                      <XCircleIcon className="size-4 shrink-0" />
                      音色名称「{trimmedName}」已存在，请换一个
                    </p>
                    <p className="text-xs text-muted-foreground">推荐以下可用名称：</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setVoiceName(name)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={!selectedFile || durationError !== null || nameDuplicate} className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary/20">
                开始复刻
              </Button>
            </form>
          )}
        </div>

        {(state.phase === "idle" || state.phase === "error") && (
          <p className="mt-5 text-center text-xs text-muted-foreground/60">
            上传的音频仅用于音色复刻，不会用于其他用途
          </p>
        )}
      </div>

      {/* Voice list */}
      <div className="border-t border-border">
        <div className="py-12">
          <VoiceList />
        </div>
      </div>
    </div>
  );
}
