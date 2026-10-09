"use client";

import { useState } from "react";
import { Provider } from "@/types";
import { ImageLightbox } from "./ImageLightbox";

export function PhotoThumbnail({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1 -ml-1 hover:bg-gray-100"
      >
        <img
          src={provider.kyc.photoImage}
          alt={`${provider.fullName} photo`}
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
      </button>

      {open && (
        <ImageLightbox
          src={provider.kyc.photoImage}
          alt={`${provider.fullName} photo`}
          caption={`${provider.fullName} · applicant photo`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
