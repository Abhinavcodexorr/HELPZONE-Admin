"use client";

import { useState } from "react";
import { Provider } from "@/types";
import { IdCard } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

export function IdProofThumbnail({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const { idType, idNumber, idDocumentImage } = provider.kyc;
  const hasImage = Boolean(idDocumentImage) && !failed;

  const label = (
    <div className="min-w-0 text-left">
      <p className="flex items-center gap-1 text-xs font-semibold text-fg-2 group-hover:text-primary">
        <IdCard className="h-3 w-3 shrink-0" />
        <span className="truncate">{idType}</span>
      </p>
      <p className="truncate text-[11px] tabular-nums text-subtle">{idNumber}</p>
    </div>
  );

  if (!hasImage) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-subtle ring-1 ring-border">
          <IdCard className="h-5 w-5" />
        </span>
        {label}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`View ${provider.fullName}'s ${idType}`}
        className="group flex items-center gap-2.5 rounded-lg text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={idDocumentImage}
          alt={`${provider.fullName} ${idType}`}
          onError={() => setFailed(true)}
          className="h-11 w-16 shrink-0 rounded-lg object-cover ring-1 ring-border transition-transform group-hover:scale-105"
        />
        {label}
      </button>

      {open && (
        <ImageLightbox
          src={idDocumentImage}
          alt={`${provider.fullName} ${idType}`}
          caption={`${idType} · ${idNumber}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
