"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { toast } from "sonner"

// ── Types ──

interface VoiceOption {
  id: string
  speakerId: string
  name: string
  source: "cloned" | "public"
  status?: string
}

interface SubtitleItem {
  text: string
  startMs: number
  endMs: number
}

// ── Helpers ──

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

/** Try to extract an array from various response shapes the public API might return */
function extractVoiceList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.data)) return d.data as unknown[]
    if (Array.isArray(d.list)) return d.list as unknown[]
    if (Array.isArray(d.voices)) return d.voices as unknown[]
    if (Array.isArray(d.result)) return d.result as unknown[]
    if (Array.isArray(d.items)) return d.items as unknown[]
  }
  return []
}

// ── Page Component ──

export default function TtsPage() {
  // Voice state
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("")

  // Form state
  const [text, setText] = useState("")
  const [speed, setSpeed] = useState(1.0)
  const [volume, setVolume] = useState(50)
  const [format, setFormat] = useState("mp3")

  // Result state
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [subtitle, setSubtitle] = useState<SubtitleItem[] | null>(null)

  // ── Fetch voices on mount ──

  useEffect(() => {
    let cancelled = false

    async function fetchVoices() {
      setVoicesLoading(true)
      const options: VoiceOption[] = []

      // Fetch local cloned voices
      try {
        const res = await fetch("/api/voices")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            for (const v of data) {
              if (v.speaker_id) {
                options.push({
                  id: `local-${v.id}`,
                  speakerId: v.speaker_id,
                  name: v.name || `Voice ${v.id}`,
                  source: "cloned" as const,
                  status: v.status,
                })
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch local voices:", err)
      }

      // Fetch public voices
      try {
        const res = await fetch("/api/voices/public")
        if (res.ok) {
          const data = await res.json()
          const list = extractVoiceList(data)

          for (const item of list) {
            const v = item as Record<string, unknown>
            const speakerId =
              (v.speaker_id as string) ??
              (v.speakerId as string) ??
              (v.id as string)
            const name =
              (v.name as string) ??
              (v.voice_name as string) ??
              (v.voiceName as string) ??
              "公共音色"

            if (speakerId) {
              options.push({
                id: `public-${speakerId}`,
                speakerId,
                name,
                source: "public" as const,
              })
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch public voices:", err)
      }

      if (!cancelled) {
        setVoices(options)
        if (options.length > 0) {
          setSelectedSpeakerId((prev) => prev || options[0].speakerId)
        }
        setVoicesLoading(false)
      }
    }

    fetchVoices()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Submit handler ──

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim() || !selectedSpeakerId) return

    setIsGenerating(true)
    setAudioUrl(null)
    setSubtitle(null)

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          speakerId: selectedSpeakerId,
          speed,
          volume,
          format,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "语音生成失败",
        )
      }

      if (!data.audioUrl) {
        throw new Error("API 未返回音频地址")
      }

      setAudioUrl(data.audioUrl as string)
      if (Array.isArray(data.subtitle) && data.subtitle.length > 0) {
        setSubtitle(data.subtitle as SubtitleItem[])
      }
      toast.success("语音生成成功")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "生成失败，请重试"
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Derived state ──

  const canSubmit =
    text.trim().length > 0 && selectedSpeakerId !== "" && !isGenerating

  // ── Render ──

  return (
    <div className="flex-1 bg-gray-50 py-12">
      <div className="mx-auto max-w-[700px] px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">文本转语音</h1>
          <p className="mt-2 text-gray-600">
            选择音色，输入文本，一键生成高质量语音
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* ── Voice Selector ── */}
          <div className="mb-6">
            <label
              htmlFor="voice"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              选择音色
            </label>

            {voicesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                加载音色列表中...
              </div>
            ) : voices.length === 0 ? (
              <p className="text-sm text-gray-500">暂无可用音色</p>
            ) : (
              <select
                id="voice"
                value={selectedSpeakerId}
                onChange={(e) => setSelectedSpeakerId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.speakerId}>
                    {voice.name}
                    {voice.source === "cloned"
                      ? voice.status === "completed"
                        ? "（已克隆）"
                        : `（${voice.status ?? "处理中"}）`
                      : "（公共）"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ── Text Input ── */}
          <div className="mb-6">
            <label
              htmlFor="text"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              输入文本
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要合成的文本内容..."
              rows={6}
              className="block w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              已输入 {text.length} 字
            </p>
          </div>

          {/* ── Optional Parameters ── */}
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              高级参数
            </summary>

            <div className="mt-4 space-y-5">
              {/* Speed */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="speed"
                    className="text-xs text-gray-600"
                  >
                    语速
                  </label>
                  <span className="text-xs font-medium text-gray-900">
                    {speed.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="speed"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.5x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* Volume */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="volume"
                    className="text-xs text-gray-600"
                  >
                    音量
                  </label>
                  <span className="text-xs font-medium text-gray-900">
                    {volume}
                  </span>
                </div>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* Format */}
              <div>
                <label
                  htmlFor="format"
                  className="mb-1 block text-xs text-gray-600"
                >
                  输出格式
                </label>
                <select
                  id="format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
              </div>
            </div>
          </details>

          {/* ── Submit Button ── */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                生成中...
              </span>
            ) : (
              "生成语音"
            )}
          </Button>
        </form>

        {/* ── Audio Player Section ── */}
        {audioUrl && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              生成结果
            </h2>

            {/* Audio player */}
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>

            {/* Download button */}
            <div className="mt-4">
              <a
                href={audioUrl}
                download={audioUrl.split("/").pop() ?? "audio.mp3"}
              >
                <Button type="button" variant="outline">
                  下载音频
                </Button>
              </a>
            </div>

            {/* Subtitle display */}
            {subtitle && subtitle.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  字幕
                </h3>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
                  {subtitle.map((item, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(item.startMs)} -{" "}
                        {formatTimestamp(item.endMs)}
                      </span>{" "}
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state (after generating but no result - should not happen normally) ── */}
        {!audioUrl && !isGenerating && (
          <p className="mt-6 text-center text-sm text-gray-400">
            输入文本并选择音色后，点击「生成语音」开始合成
          </p>
        )}
      </div>
    </div>
  )
}
