"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function ImageLightbox({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-4 top-4 flex h-9 w-9 animate-fade-in items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-90"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="relative flex max-h-full max-w-4xl animate-pop-in flex-col items-center">
        <div className="relative">
          {!loaded && <div aria-hidden className="skeleton absolute inset-0 min-h-64 min-w-64 rounded-xl" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0) setLoaded(true);
            }}
            src={src}
            alt={alt}
            onLoad={() => setLoaded(true)}
            className={`max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl transition-opacity duration-500 ${
              loaded ? "opacity-100" : "min-h-64 min-w-64 opacity-0"
            }`}
          />
        </div>
        {caption && <p className="mt-3 text-sm text-white/80">{caption}</p>}
      </div>
    </div>,
    document.body
  );
}
