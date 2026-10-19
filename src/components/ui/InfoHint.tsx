"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const WIDTH = 288;

/**
 * A small (i) button that explains where a number comes from. Opens on hover or tap.
 * Rendered in a portal and clamped to the viewport, so it never spills off a phone screen.
 */
export function InfoHint({ title, children }: { title: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visible = hovered || pinned;

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(WIDTH, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
    setPos({ top: rect.bottom + 8, left });
  }

  useEffect(() => {
    if (!visible) return;
    place();
    function onPointerDown(e: MouseEvent) {
      if (!buttonRef.current?.contains(e.target as Node)) setPinned(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [visible]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`How "${title}" is calculated`}
        aria-expanded={visible}
        onClick={() => setPinned((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-subtle transition hover:bg-surface-3 hover:text-foreground"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {visible &&
        pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.min(WIDTH, window.innerWidth - 16) }}
            className="pointer-events-none z-[90] animate-pop-in rounded-xl border border-border bg-surface p-3.5 text-left shadow-xl"
          >
            <p className="text-xs font-semibold text-foreground">{title}</p>
            <div className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-muted">{children}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
