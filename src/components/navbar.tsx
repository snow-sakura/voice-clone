"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/clone", label: "声音克隆" },
  { href: "/tts", label: "文本转语音" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="mx-auto flex h-15 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-foreground/90 hover:text-foreground transition-colors"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/25">
            V
          </span>
          <span className="text-base tracking-tight">声音克隆</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
