"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionsMenuProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MENU_WIDTH = 160;
const MENU_GAP = 6;

export function ActionsMenu({ onView, onEdit, onDelete }: ActionsMenuProps) {
  const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = position !== null;

  // The table sits in an overflow-x-auto wrapper, which would clip an
  // absolutely-positioned menu. Rendering it in a portal with fixed
  // coordinates keeps it fully visible.
  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = 120;
    const flipUp = window.innerHeight - rect.bottom < estimatedHeight + MENU_GAP;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPosition(
      flipUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP, left }
        : { top: rect.bottom + MENU_GAP, left }
    );
  }

  function close() {
    setPosition(null);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  function run(action: () => void) {
    close();
    action();
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (open ? close() : openMenu())}
        title="Actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-surface-3 hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: position.top, bottom: position.bottom, left: position.left, width: MENU_WIDTH }}
            className="z-[80] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl"
          >
            <MenuItem icon={Eye} label="View" onClick={() => run(onView)} />
            <MenuItem icon={Pencil} label="Edit" onClick={() => run(onEdit)} />
            <MenuItem icon={Trash2} label="Delete" tone="danger" onClick={() => run(onDelete)} />
          </div>,
          document.body
        )}
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-surface-2",
        tone === "danger" && "text-danger",
        tone === "default" && "text-fg-2"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
