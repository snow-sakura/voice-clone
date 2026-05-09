import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { NavBar } from "../components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "声音克隆 — AI 音色复刻与语音合成",
  description: "使用 AI 技术克隆声音并合成语音",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border/60 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground/60">
            <p>
              基于阿里云百炼 DashScope AI 驱动 &middot; 本地部署 &middot;
              数据安全
            </p>
          </div>
        </footer>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "var(--radius-lg)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
