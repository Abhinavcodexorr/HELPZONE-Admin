"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, VideoOff, X } from "lucide-react";

export function VideoModal({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/85 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 animate-fade-in items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-90"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex w-full max-w-3xl animate-pop-in flex-col items-center">
        {failed ? (
          <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-surface px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <VideoOff className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-foreground">This video can&apos;t be played here</p>
            <p className="max-w-sm text-sm text-muted">
              The browser couldn&apos;t load or decode the file. You can still open it directly.
            </p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              <ExternalLink className="h-4 w-4" />
              Open video
            </a>
          </div>
        ) : (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            onError={() => setFailed(true)}
            className="max-h-[78vh] w-full rounded-2xl bg-black shadow-2xl"
          />
        )}
        <p className="mt-3 text-sm text-white/80">{title}</p>
      </div>
    </div>,
    document.body
  );
}
