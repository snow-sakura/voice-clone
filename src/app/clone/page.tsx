"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";

// ── Types ──

type CloneState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "completed"; voiceId: number; zhipuVoiceId: string; demoAudioUrl: string; voiceName: string }
  | { phase: "error"; message: string };

// ── Constants ──

const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
  "audio/x-m4a",
  "audio/aac",
];
const ACCEPTED_EXTENSIONS = ".mp3,.mp4,.wav,.webm,.ogg,.flac,.m4a,.aac";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const DEFAULT_DEMO_TEXT = "欢迎使用智谱AI音色复刻服务";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ──

export default function ClonePage() {
  const [state, setState] = useState<CloneState>({ phase: "idle" });
  const [voiceName, setVoiceName] = useState("");
  const [text, setText] = useState("");
  const [input, setInput] = useState(DEFAULT_DEMO_TEXT);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File validation ──

  function validateFile(file: File): string | null {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && file.type !== "") {
      return `不支持的音频格式: ${file.type || "未知"}。支持的格式: ${ACCEPTED_EXTENSIONS}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件过大: ${formatFileSize(file.size)}。最大支持 ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  }

  // ── Submit handler ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("请选择音频文件");
      return;
    }

    const fileError = validateFile(selectedFile);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    const trimmedVoiceName = voiceName.trim();
    if (!trimmedVoiceName) {
      toast.error("请输入音色名称");
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      toast.error("请输入参考音频文本");
      return;
    }

    setState({ phase: "submitting" });

    try {
      const formData = new FormData();
      formData.append("audio", selectedFile);
      formData.append("voiceName", trimmedVoiceName);
      formData.append("text", trimmedText);
      formData.append("input", input.trim() || DEFAULT_DEMO_TEXT);

      const res = await fetch("/api/voices/clone", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `请求失败 (${res.status})`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "复刻失败");
      }

      setState({
        phase: "completed",
        voiceId: data.voiceId,
        zhipuVoiceId: data.zhipuVoiceId,
        demoAudioUrl: data.demoAudioUrl,
        voiceName: trimmedVoiceName,
      });

      toast.success("音色复刻成功！");
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setState({ phase: "error", message });
      toast.error(message);
    }
  }

  // ── Event handlers ──

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only reset drag state when actually leaving the dropzone,
    // not when moving over child elements
    const target = e.currentTarget as HTMLElement;
    if (!target.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleReset() {
    setState({ phase: "idle" });
    setSelectedFile(null);
    setVoiceName("");
    setText("");
    setInput(DEFAULT_DEMO_TEXT);
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            音色复刻
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            基于智谱 AI glm-tts-clone 模型，上传一段音频即可复刻专属音色
          </p>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          {/* ── Completed ── */}
          {state.phase === "completed" && (
            <div className="space-y-6">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <svg
                  className="w-6 h-6 text-green-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    音色复刻成功
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {state.voiceName}
                  </p>
                </div>
              </div>

              {/* Voice details */}
              <div className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">音色名称</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {state.voiceName}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">音色ID</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {state.zhipuVoiceId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">本地ID</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {state.voiceId}
                  </span>
                </div>
              </div>

              {/* Demo audio player */}
              {state.demoAudioUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    试听音频
                  </p>
                  <audio controls src={state.demoAudioUrl} className="w-full">
                    您的浏览器不支持音频播放
                  </audio>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  继续复刻
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(state.zhipuVoiceId);
                    toast.success("音色ID已复制到剪贴板");
                  }}
                  className="flex-1"
                >
                  复制音色ID
                </Button>
              </div>
            </div>
          )}

          {/* ── Submitting ── */}
          {state.phase === "submitting" && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                正在复刻音色，请稍候...
              </p>
            </div>
          )}

          {/* ── Error ── */}
          {state.phase === "error" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <svg
                  className="w-6 h-6 text-red-500 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    复刻失败
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {state.message}
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={handleReset} className="w-full">
                重新尝试
              </Button>
            </div>
          )}

          {/* ── Idle / form ── */}
          {(state.phase === "idle" || state.phase === "error") && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Drag-and-drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative rounded-2xl border-2 border-dashed p-12 text-center
                  transition-all duration-200 cursor-pointer
                  ${dragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-600"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-10 h-10 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      移除
                    </button>
                  </div>
                ) : dragOver ? (
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                      />
                    </svg>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      松开以上传文件
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        点击上传
                      </span>
                      {" "}或拖拽音频文件到此处
                    </p>
                    <p className="text-xs text-gray-400">
                      支持 {ACCEPTED_EXTENSIONS}，最大 {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                  </div>
                )}
              </div>

              {/* Text inputs */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="voiceName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    音色名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="voiceName"
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="为这个音色取一个名字，如：我的声音"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>

                <div>
                  <label
                    htmlFor="text"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    参考音频文本 <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1">
                    上传音频对应的文字内容，用于智谱API文本对齐
                  </p>
                  <input
                    id="text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="请输入音频中说话的文字内容"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    试听文本 <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1">
                    用于生成试听音频的演示文本
                  </p>
                  <input
                    id="input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={DEFAULT_DEMO_TEXT}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={!selectedFile}
                className="w-full"
                size="lg"
              >
                开始复刻
              </Button>
            </form>
          )}
        </div>

        {/* Footer hint */}
        {(state.phase === "idle" || state.phase === "error") && (
          <p className="mt-4 text-center text-xs text-gray-400">
            上传的音频仅用于音色复刻，不会用于其他用途
          </p>
        )}
      </div>
    </div>
  );
}
