import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center flex-1">
      {/* ── Decorative background blobs ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-violet-500/6 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center flex-1 px-6 py-20 sm:py-28 max-w-6xl mx-auto w-full">
        {/* ── Hero ── */}
        <section className="text-center max-w-2xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            AI 驱动的声音克隆引擎
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mb-6">
            让你的声音
            <br />
            <span className="text-gradient">跨越时空</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto">
            上传一段音频，即可复刻专属音色。用复刻的声音朗读任意文本，
            <br className="hidden sm:block" />
            让每一次表达都独一无二。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/clone"
              className="inline-flex items-center gap-2 h-11 px-8 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              开始声音克隆
            </Link>
            <Link
              href="/tts"
              className="inline-flex items-center gap-2 h-11 px-8 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              文本转语音
            </Link>
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full mt-24">
          {/* Card 1: Clone */}
          <div className="group relative rounded-2xl border border-border bg-card p-6 card-hover">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              音色复刻
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              上传 10-300 秒的参考音频，AI 自动学习声音特征并生成专属音色模型。
            </p>
            <Link
              href="/clone"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2 transition-all"
            >
              开始复刻
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Card 2: TTS */}
          <div className="group relative rounded-2xl border border-border bg-card p-6 card-hover">
            <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              语音合成
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              选择已复刻的音色或预设音色，输入文本即可生成自然流畅的语音音频。
            </p>
            <Link
              href="/tts"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-500 hover:gap-2 transition-all"
            >
              开始合成
              <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Card 3: Tech */}
          <div className="group relative rounded-2xl border border-border bg-card p-6 sm:col-span-2 lg:col-span-1 card-hover">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              先进技术
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              基于阿里云百炼 Qwen3-TTS 模型，毫秒级语音生成，支持多种语言和方言。
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                7 种预设音色
              </span>
            </span>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <div className="mt-24 text-center">
          <p className="text-sm text-muted-foreground/60">
            上传的音频仅用于音色复刻，不会用于其他用途
          </p>
        </div>
      </div>
    </div>
  );
}
