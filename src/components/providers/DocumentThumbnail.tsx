"use client";

import { useState } from "react";
import { IdCard } from "lucide-react";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { ImageLightbox } from "./ImageLightbox";

/** A document image + type/number, with a click-to-enlarge lightbox. Used for both the primary ID proof and the PAN card column. */
export function DocumentThumbnail({
  providerName,
  idType,
  idNumber,
  idDocumentImage,
  emptyLabel = "No document uploaded",
}: {
  providerName: string;
  idType: string;
  idNumber: string;
  idDocumentImage: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
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
        <p className="text-xs text-subtle">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`View ${providerName}'s ${idType}`}
        className="group flex items-center gap-2.5 rounded-lg text-left"
      >
        <ShimmerImage
          src={idDocumentImage}
          alt={`${providerName} ${idType}`}
          onError={() => setFailed(true)}
          wrapperClassName="h-11 w-16 shrink-0 rounded-lg ring-1 ring-border transition-transform duration-200 group-hover:scale-105"
        />
        {label}
      </button>

      {open && (
        <ImageLightbox
          src={idDocumentImage}
          alt={`${providerName} ${idType}`}
          caption={`${idType} · ${idNumber}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
