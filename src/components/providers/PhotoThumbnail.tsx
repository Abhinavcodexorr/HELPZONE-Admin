"use client";

import { useState } from "react";
import { Provider } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { ImageLightbox } from "./ImageLightbox";

export function PhotoThumbnail({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = provider.kyc.photoImage;

  if (!src || failed) {
    return <Avatar name={provider.fullName} color={provider.avatarColor} size={44} />;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`View ${provider.fullName}'s photo`}
        className="block rounded-xl transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <ShimmerImage
          src={src}
          alt={`${provider.fullName} photo`}
          onError={() => setFailed(true)}
          wrapperClassName="h-11 w-11 rounded-xl ring-1 ring-border"
        />
      </button>

      {open && (
        <ImageLightbox
          src={src}
          alt={`${provider.fullName} photo`}
          caption={`${provider.fullName} · applicant photo`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
