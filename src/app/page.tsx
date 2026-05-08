import Link from "next/link";
import { buttonVariants } from "../components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
      {/* Hero */}
      <section className="text-center max-w-xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          声音克隆工具
        </h1>
        <p className="text-muted-foreground text-lg">
          使用 AI 技术克隆声音并合成语音
        </p>
      </section>

      {/* Feature Cards */}
      <section className="grid sm:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Card 1: 声音克隆 */}
        <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-2">声音克隆</h2>
          <p className="text-muted-foreground text-sm mb-4">
            上传参考音频，克隆任意声音
          </p>
          <Link href="/clone" className={buttonVariants()}>
            开始克隆
          </Link>
        </div>

        {/* Card 2: 文本转语音 */}
        <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-2">文本转语音</h2>
          <p className="text-muted-foreground text-sm mb-4">
            使用克隆音色合成语音
          </p>
          <Link href="/tts" className={buttonVariants({ variant: "outline" })}>
            开始合成
          </Link>
        </div>
      </section>
    </div>
  );
}
