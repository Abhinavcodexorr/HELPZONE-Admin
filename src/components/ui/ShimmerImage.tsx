"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShimmerImageProps {
  src: string;
  alt: string;
  wrapperClassName?: string;
  imgClassName?: string;
  onError?: () => void;
}

// Shows a shimmering placeholder until the image has loaded, then fades it in.
export function ShimmerImage({ src, alt, wrapperClassName, imgClassName, onError }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={cn("relative block overflow-hidden", wrapperClassName)}>
      {!loaded && <span aria-hidden className="skeleton absolute inset-0 rounded-[inherit]" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(el) => {
          // Cached images can finish loading before React attaches onLoad.
          if (el?.complete && el.naturalWidth > 0) setLoaded(true);
        }}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
      />
    </span>
  );
}
