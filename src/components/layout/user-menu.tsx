"use client";

import { useState } from "react";
import { ChevronDown, Settings, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

// 模拟用户数据，后续可替换为真实数据
const mockUser = {
  name: "测试用户",
  email: "test@example.com",
};

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const initials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
      >
        {/* 头像 */}
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-primary font-medium text-xs">
          {initials || <User className="size-4" />}
        </div>
        <div className="flex-1 text-left">
          <div className="truncate font-medium text-sidebar-foreground">
            {mockUser.name}
          </div>
          <div className="truncate text-xs text-sidebar-foreground/50">
            {mockUser.email}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-sidebar-foreground/50 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 点击外部关闭 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-lg z-20">
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              onClick={() => {
                setIsOpen(false);
                // TODO: 跳转到个人设置
              }}
            >
              <Settings className="size-4" />
              个人设置
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => {
                setIsOpen(false);
                // TODO: 登出逻辑
              }}
            >
              <LogOut className="size-4" />
              登出
            </button>
          </div>
        </>
      )}
    </div>
  );
}
