"use client";

import { Home, Mic, MessageSquare, Library } from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";
import { UserMenu } from "./user-menu";

const navItems = [
  { icon: Home, label: "首页", href: "/" },
  { icon: Mic, label: "语音克隆", href: "/clone" },
  { icon: MessageSquare, label: "文本转语音", href: "/tts" },
  { icon: Library, label: "音色库", href: "/library" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo 区域 */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm shadow-primary/30">
          V
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          声音克隆
        </span>
      </div>

      {/* 导航区域 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
          />
        ))}
      </nav>

      {/* 用户区域 */}
      <div className="border-t border-sidebar-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
