"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";

// ── Types ──

interface TaskInfo {
  taskId: string;
  status: string;
  result?: {
    speakerId?: string;
    demoAudioUrl?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type CloneState =
  | { phase: "form" }
  | { phase: "submitting" }
  | { phase: "tracking"; taskId: string };

// ── Constants ──

const MODELS = [
  { value: "V1", label: "V1" },
  { value: "V2", label: "V2" },
  { value: "V3", label: "V3（推荐：音色最还原逼真）" },
  { value: "S1", label: "S1" },
  { value: "S3", label: "S3" },
] as const;

const POLL_INTERVAL_MS = 2000;

// ── Helpers ──

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sub-components ──

function TaskTrackingView({
  taskId,
  onCloneAgain,
}: {
  taskId: string;
  onCloneAgain: () => void;
}) {
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/voices/clone/${taskId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `请求失败 (${res.status})`);
        }
        const data: TaskInfo = await res.json();
        if (!cancelled) {
          setTask(data);

          const status = data.status?.toLowerCase();
          if (status === "succeed" || status === "failed" || status === "error") {
            // Stop polling
            return;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "轮询任务状态失败");
        }
      }
    }

    // Initial fetch
    poll();

    // Start polling
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [taskId]);

  const status = task?.status?.toLowerCase();

  // Clean up polling when task reaches terminal state
  useEffect(() => {
    if (status === "succeed" || status === "failed" || status === "error") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">克隆任务已提交</h2>
        <p className="mt-1 text-sm text-gray-500">
          任务ID: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{taskId}</code>
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {status === "succeed" ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-green-700">完成!</span>
          </>
        ) : status === "failed" || status === "error" ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium text-red-700">失败</span>
          </>
        ) : error ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium text-red-700">轮询出错</span>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <span className="font-medium text-blue-700">处理中...</span>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result details on success */}
      {status === "succeed" && task?.result && (
        <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
          {task.result.speakerId && (
            <div>
              <span className="text-sm font-medium text-gray-600">说话人ID：</span>
              <code className="ml-1 rounded bg-white px-1.5 py-0.5 font-mono text-sm text-gray-900">
                {task.result.speakerId}
              </code>
            </div>
          )}

          {task.result.demoAudioUrl && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">试听音频：</p>
              <audio controls className="w-full">
                <source src={task.result.demoAudioUrl} type="audio/mpeg" />
                您的浏览器不支持音频播放。
              </audio>
            </div>
          )}
        </div>
      )}

      {/* Failure details */}
      {(status === "failed" || status === "error") && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          克隆任务失败。请检查音频文件是否符合要求（5-120秒，清晰人声），或稍后重试。
        </div>
      )}

      {/* Clone again button */}
      <Button variant="outline" onClick={onCloneAgain}>
        重新克隆
      </Button>
    </div>
  );
}

// ── Main page component ──

export default function ClonePage() {
  const [state, setState] = useState<CloneState>({ phase: "form" });
  const [voiceName, setVoiceName] = useState("");
  const [model, setModel] = useState("V3");
  const [errors, setErrors] = useState<{ audio?: string; voiceName?: string }>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // react-dropzone handles the file filtering; we store the first file
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setErrors((prev) => ({ ...prev, audio: undefined }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/wav": [".wav"],
      "audio/mpeg": [".mp3"],
      "audio/mp4": [".m4a"],
      "audio/aac": [".aac"],
    },
    maxFiles: 1,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function validate(): boolean {
    const newErrors: { audio?: string; voiceName?: string } = {};

    if (!selectedFile) {
      newErrors.audio = "请选择音频文件";
    }
    if (!voiceName.trim()) {
      newErrors.voiceName = "请输入声音名称";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setState({ phase: "submitting" });

    try {
      const formData = new FormData();
      formData.append("audio", selectedFile!);
      formData.append("voiceName", voiceName.trim());
      formData.append("model", model);

      const res = await fetch("/api/voices/clone", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `请求失败 (${res.status})`);
      }

      const data = await res.json();

      toast.success("克隆任务已提交");

      setState({ phase: "tracking", taskId: data.taskId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败，请稍后重试";
      toast.error(message);
      setState({ phase: "form" });
    }
  }

  function handleCloneAgain() {
    setSelectedFile(null);
    setVoiceName("");
    setModel("V3");
    setErrors({});
    setState({ phase: "form" });
  }

  // ── Task tracking view ──
  if (state.phase === "tracking") {
    return (
      <div className="flex flex-1 items-start justify-center py-16 px-4">
        <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <TaskTrackingView taskId={state.taskId} onCloneAgain={handleCloneAgain} />
        </div>
      </div>
    );
  }

  // ── Form view (includes submitting state) ──
  return (
    <div className="flex flex-1 items-start justify-center py-16 px-4">
      <div className="w-full max-w-xl space-y-8">
        {/* Page header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">声音克隆</h1>
          <p className="mt-2 text-gray-500">
            上传一段 5-120 秒的清晰人声录音，我们将克隆出您专属的 AI 声音模型。
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Audio file upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上传音频
              </label>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : errors.audio
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />

                {selectedFile ? (
                  <div className="space-y-1">
                    <svg
                      className="mx-auto h-8 w-8 text-blue-500"
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
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      移除
                    </button>
                  </div>
                ) : isDragActive ? (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-8 w-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-blue-600 font-medium">松开以上传文件</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-gray-600">
                      拖拽音频文件到此处，或点击选择
                    </p>
                    <p className="text-xs text-gray-400">支持 WAV、MP3、M4A、AAC 格式</p>
                  </div>
                )}
              </div>
              {errors.audio && <p className="mt-1 text-sm text-red-600">{errors.audio}</p>}
            </div>

            {/* Voice name input */}
            <div>
              <label htmlFor="voiceName" className="block text-sm font-medium text-gray-700 mb-2">
                声音名称
              </label>
              <input
                id="voiceName"
                type="text"
                value={voiceName}
                onChange={(e) => {
                  setVoiceName(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, voiceName: undefined }));
                  }
                }}
                placeholder="例如：我的声音"
                disabled={state.phase === "submitting"}
                className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-gray-400 ${
                  errors.voiceName
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {errors.voiceName && (
                <p className="mt-1 text-sm text-red-600">{errors.voiceName}</p>
              )}
            </div>

            {/* Model selector */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                克隆模型
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={state.phase === "submitting"}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                推荐使用 V3 模型，音色还原度最高，效果最逼真。
              </p>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={state.phase === "submitting"}
              className="w-full"
              size="lg"
            >
              {state.phase === "submitting" ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  提交中...
                </span>
              ) : (
                "开始克隆"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
