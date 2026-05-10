import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background">
        {children}

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
