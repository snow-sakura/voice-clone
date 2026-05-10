import { VoiceList } from "@/components/voice-list";

export default function LibraryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 页面头部 */}
      <div className="border-b border-border bg-card/50 px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          音色库
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理您的已克隆音色和预设音色
        </p>
      </div>

      {/* 音色列表 */}
      <div className="flex-1 p-8">
        <VoiceList />
      </div>
    </div>
  );
}
