"use client";

import { useState } from "react";
import { Provider } from "@/types";
import { IdCard } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

export function IdProofThumbnail({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 rounded-lg p-1 -ml-1 hover:bg-gray-100"
      >
        <img
          src={provider.kyc.idDocumentImage}
          alt={`${provider.fullName} ${provider.kyc.idType}`}
          className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-border"
        />
        <div className="text-left">
          <p className="flex items-center gap-1 text-xs font-medium text-gray-700 group-hover:text-primary">
            <IdCard className="h-3 w-3" />
            {provider.kyc.idType}
          </p>
          <p className="text-[11px] text-gray-400">{provider.kyc.idNumber}</p>
        </div>
      </button>

      {open && (
        <ImageLightbox
          src={provider.kyc.idDocumentImage}
          alt={`${provider.fullName} ${provider.kyc.idType}`}
          caption={`${provider.kyc.idType} · ${provider.kyc.idNumber}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
