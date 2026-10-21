"use client";

import { useState } from "react";
import { IdCard } from "lucide-react";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import type { Provider } from "@/types";
import { DocumentThumbnail } from "./DocumentThumbnail";
import { ImageLightbox } from "./ImageLightbox";

/** The listing's ID-proof cell. An ID with two sides (Aadhaar) shows both, each enlargeable. */
export function IdProofThumbnail({ provider }: { provider: Provider }) {
  const { idType, idNumber, idDocumentImage, idDocumentBackImage } = provider.kyc;
  const [open, setOpen] = useState<"front" | "back" | null>(null);
  const [failed, setFailed] = useState<{ front?: boolean; back?: boolean }>({});

  if (!idDocumentBackImage) {
    return <DocumentThumbnail providerName={provider.fullName} idType={idType} idNumber={idNumber} idDocumentImage={idDocumentImage} />;
  }

  const sides = [
    { key: "front" as const, label: "Front", src: idDocumentImage },
    { key: "back" as const, label: "Back", src: idDocumentBackImage },
  ];
  const shown = open ? sides.find((s) => s.key === open) : undefined;

  return (
    <>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {sides.map((side) =>
            side.src && !failed[side.key] ? (
              <button
                key={side.key}
                onClick={() => setOpen(side.key)}
                aria-label={`View ${provider.fullName}'s ${idType} ${side.label.toLowerCase()}`}
                title={side.label}
                className="group relative"
              >
                <ShimmerImage
                  src={side.src}
                  alt={`${provider.fullName} ${idType} ${side.label}`}
                  onError={() => setFailed((f) => ({ ...f, [side.key]: true }))}
                  wrapperClassName="h-11 w-16 shrink-0 rounded-lg ring-1 ring-border transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/55 px-1 text-[9px] font-medium leading-4 text-white">{side.label}</span>
              </button>
            ) : (
              <span key={side.key} title={`${side.label} not uploaded`} className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-subtle ring-1 ring-border">
                <IdCard className="h-5 w-5" />
              </span>
            ),
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-fg-2">
          <IdCard className="h-3 w-3 shrink-0" />
          <span className="truncate">{idType}</span>
          <span className="truncate font-normal tabular-nums text-subtle">{idNumber !== "—" ? `· ${idNumber}` : ""}</span>
        </p>
      </div>

      {shown && (
        <ImageLightbox
          src={shown.src}
          alt={`${provider.fullName} ${idType} ${shown.label}`}
          caption={`${idType} (${shown.label.toLowerCase()}) · ${idNumber}`}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
