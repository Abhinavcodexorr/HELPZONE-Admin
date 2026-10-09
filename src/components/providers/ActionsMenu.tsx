"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Eye, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionsMenuProps {
  canApprove: boolean;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionsMenu({ canApprove, onView, onApprove, onReject, onEdit, onDelete }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Actions"
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
          <MenuItem icon={Eye} label="View" onClick={() => run(onView)} />
          {canApprove && (
            <>
              <MenuItem icon={Check} label="Approve" tone="success" onClick={() => run(onApprove)} />
              <MenuItem icon={X} label="Reject" tone="danger" onClick={() => run(onReject)} />
            </>
          )}
          <MenuItem icon={Pencil} label="Edit" onClick={() => run(onEdit)} />
          <MenuItem icon={Trash2} label="Delete" tone="danger" onClick={() => run(onDelete)} />
        </div>
      )}
    </div>
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
  tone?: "default" | "success" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-gray-50",
        tone === "success" && "text-emerald-600",
        tone === "danger" && "text-rose-600",
        tone === "default" && "text-gray-700"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
