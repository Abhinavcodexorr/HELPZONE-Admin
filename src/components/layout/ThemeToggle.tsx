"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";

// Light by default, always. Dark only lasts for this tab's session.
function resolveTheme(): "light" | "dark" {
  try {
    return sessionStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeToggle() {
  // React's dev-mode remount clears attributes the inline script set on
  // <html>, so re-apply the resolved theme before paint. No-op in production.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", resolveTheme());
  }, []);

  function toggle() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      sessionStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      title="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
