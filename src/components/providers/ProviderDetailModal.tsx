"use client";

import { useState } from "react";
import { Provider } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RejectModal } from "./RejectModal";
import { ImageLightbox } from "./ImageLightbox";
import { formatDate } from "@/lib/utils";
import { Check, X, Mail, Phone, MessageCircle, MapPin, FileWarning, Briefcase, Calendar, ZoomIn } from "lucide-react";

const statusTone = {
  pending: "amber",
  approved: "green",
  rejected: "red",
} as const;

export function ProviderDetailModal({
  provider,
  onClose,
  onApprove,
  onReject,
}: {
  provider: Provider;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const p = provider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <Avatar name={p.fullName} color={p.avatarColor} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-gray-900">{p.fullName}</p>
              <Badge tone={statusTone[p.status]}>{p.status}</Badge>
            </div>
            <p className="text-xs text-gray-400">
              {p.id} &middot; {p.gender} &middot; {p.nationality}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="indigo">{p.category}</Badge>
              <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
        </div>

        {/* Contact & location */}
        <div className="mt-5 grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-3 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {p.area}, {p.city}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{p.email}</span>
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {p.mobileNumber}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {p.whatsappNumber}
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Briefcase className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {p.experienceYears} {p.experienceYears === 1 ? "year" : "years"} experience
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            Applied {formatDate(p.submittedAt)}
          </p>
        </div>

        {/* KYC documents */}
        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-gray-400">
          KYC Documents
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <button
              type="button"
              onClick={() =>
                setLightboxImage({
                  src: p.kyc.idDocumentImage,
                  alt: `${p.fullName} ${p.kyc.idType}`,
                  caption: `${p.kyc.idType} · ${p.kyc.idNumber}`,
                })
              }
              className="group relative block w-full"
            >
              <img
                src={p.kyc.idDocumentImage}
                alt={`${p.fullName} ${p.kyc.idType}`}
                className="h-28 w-full rounded-xl object-cover ring-1 ring-border transition-opacity group-hover:opacity-90"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-white" />
              </span>
            </button>
            <p className="mt-1.5 text-xs font-medium text-gray-700">{p.kyc.idType}</p>
            <p className="text-[11px] text-gray-400">{p.kyc.idNumber}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() =>
                setLightboxImage({
                  src: p.kyc.photoImage,
                  alt: `${p.fullName} photo`,
                  caption: `Applicant photo · submitted ${formatDate(p.submittedAt)}`,
                })
              }
              className="group relative block w-full"
            >
              <img
                src={p.kyc.photoImage}
                alt={`${p.fullName} photo`}
                className="h-28 w-full rounded-xl object-cover ring-1 ring-border transition-opacity group-hover:opacity-90"
              />
              <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                <ZoomIn className="h-5 w-5 text-white" />
              </span>
            </button>
            <p className="mt-1.5 text-xs font-medium text-gray-700">Applicant Photo</p>
            <p className="text-[11px] text-gray-400">Submitted {formatDate(p.submittedAt)}</p>
          </div>
        </div>

        {p.status === "rejected" && p.rejectionReason && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
            <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Reason: </span>
              {p.rejectionReason}
            </span>
          </p>
        )}

        {p.status === "pending" && (
          <div className="mt-5 flex gap-2">
            <Button
              variant="success"
              size="sm"
              className="flex-1"
              onClick={() => {
                onApprove(p.id);
                onClose();
              }}
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={() => setShowRejectModal(true)}
            >
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          providerName={p.fullName}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={(reason) => {
            onReject(p.id, reason);
            setShowRejectModal(false);
            onClose();
          }}
        />
      )}

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          caption={lightboxImage.caption}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
