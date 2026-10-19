"use client";

import { useState } from "react";
import { Play, VideoOff } from "lucide-react";
import { Provider } from "@/types";
import { VideoModal } from "./VideoModal";

export function VideoThumbnail({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const src = provider.introVideoUrl;

  if (!src) {
    return (
      <div className="flex items-center gap-2 text-xs text-subtle">
        <VideoOff className="h-4 w-4" />
        No video
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Play ${provider.fullName}'s intro video`}
        className="group flex items-center gap-2.5 text-left"
      >
        <span className="relative block h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-900 ring-1 ring-border transition-transform duration-200 group-hover:scale-105">
          {provider.introVideoThumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote S3 thumbnail
            <img src={provider.introVideoThumbnailUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            !broken && (
            // #t=0.1 asks the browser to render the first frame as a still poster.
            <video
              src={`${src}#t=0.1`}
              preload="metadata"
              muted
              playsInline
              onError={() => setBroken(true)}
              className="h-full w-full object-cover"
            />
            )
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow">
              <Play className="h-3 w-3 translate-x-px fill-current" />
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold text-fg-2 group-hover:text-primary">Play intro</span>
      </button>

      {open && (
        <VideoModal src={src} poster={provider.introVideoThumbnailUrl} title={`${provider.fullName} · intro video`} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
