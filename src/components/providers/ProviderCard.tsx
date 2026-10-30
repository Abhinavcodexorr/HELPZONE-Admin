"use client";

import { useState } from "react";
import { Check, Clock, Eye, FileText, MapPin, Pencil, Phone, Radar, ShieldCheck, Trash2, Video, X, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn, timeAgo } from "@/lib/utils";
import type { Provider, ProviderStatus } from "@/types";

const statusTone: Record<ProviderStatus, "green" | "amber" | "red" | "blue"> = {
  approved: "green",
  pending: "amber",
  verification: "blue",
  rejected: "red",
};

const statusLabel: Record<ProviderStatus, string> = {
  pending: "New request",
  verification: "In verification",
  approved: "Approved",
  rejected: "Rejected",
};

/** What the provider has uploaded, shown only for what exists (nothing is listed for missing items). */
function uploads(p: Provider) {
  const items: { key: string; label: string; icon: typeof FileText }[] = [];
  if (p.kyc.idDocumentImage) items.push({ key: "aadhaar", label: "Aadhaar", icon: FileText });
  if (p.panCard?.idDocumentImage) items.push({ key: "pan", label: "PAN", icon: FileText });
  if (p.introVideoUrl) items.push({ key: "video", label: "Video", icon: Video });
  return items;
}

const toneClass = {
  neutral: "bg-surface text-fg-2 ring-border hover:bg-surface-3 hover:text-foreground",
  primary: "bg-primary text-primary-foreground ring-primary hover:brightness-110",
  success: "bg-success-solid text-white ring-transparent hover:brightness-110",
  danger: "bg-surface text-danger ring-danger/25 hover:bg-danger-soft",
} as const;

/** View / Edit / Delete: icon + short label, equal width, so they stay clear at every card size. */
function SecondaryAction({
  icon: Icon,
  label,
  title,
  onClick,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  onClick: () => void;
  tone?: keyof typeof toneClass;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn("flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold ring-1 transition active:scale-95", toneClass[tone])}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** An icon + text action (used for the review steps: Verify, Approve, Reject). */
function TextAction({
  icon: Icon,
  label,
  onClick,
  tone,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone: keyof typeof toneClass;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold ring-1 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        toneClass[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{label}</span>
    </button>
  );
}

/** A provider as a card: big photo, who/where, what they offer, what they've uploaded, and the next step. */
export function ProviderCard({
  provider: p,
  busy,
  index,
  onOpen,
  onVerify,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: {
  provider: Provider;
  busy: boolean;
  index: number;
  onOpen: () => void;
  onVerify: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = p.kyc.photoImage && !photoFailed ? p.kyc.photoImage : "";
  const place = [p.city !== "—" ? p.city : "", p.area].filter(Boolean).join(" · ");
  const sub = [p.state, p.pincode].filter(Boolean).join(" · ");
  const files = uploads(p);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      className="group flex animate-fade-in flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-shadow hover:shadow-lg"
    >
      {/* Photo */}
      <button type="button" onClick={onOpen} aria-label={`Open ${p.fullName}`} className="relative block h-32 w-full overflow-hidden bg-surface-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={p.fullName}
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft via-surface-2 to-accent-soft">
            <Avatar name={p.fullName} color={p.avatarColor} size={64} />
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />
        <Badge tone={statusTone[p.status]} dot className="absolute left-3 top-3 shadow-sm">
          {statusLabel[p.status]}
        </Badge>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          <Clock className="h-3 w-3" /> {timeAgo(p.submittedAt)}
        </span>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <h3 className="truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary">{p.fullName}</h3>
        </button>

        <div className="mt-1.5 space-y-1 text-sm text-fg-2">
          {p.mobileNumber !== "—" && (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-subtle" />
              <span className="truncate">{p.mobileNumber}</span>
            </p>
          )}
          {(place || sub) && (
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-subtle" />
              <span className="min-w-0">
                {place && <span className="block truncate">{place}</span>}
                {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
              </span>
            </p>
          )}
          {p.serviceRadiusKm ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Radar className="h-3.5 w-3.5 shrink-0 text-subtle" /> Within {p.serviceRadiusKm} km
            </p>
          ) : null}
        </div>

        {p.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.categories.slice(0, 3).map((c) => (
              <span key={c} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {c}
              </span>
            ))}
            {p.categories.length > 3 && (
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-border">+{p.categories.length - 3}</span>
            )}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {files.map(({ key, label, icon: Icon }) => (
              <span key={key} className="flex items-center gap-1 rounded-lg bg-success-soft px-2 py-1 text-[11px] font-semibold text-success">
                <Icon className="h-3 w-3" /> {label}
                <Check className="h-3 w-3" />
              </span>
            ))}
          </div>
        )}

        {p.status === "rejected" && p.rejectionReason && (
          <p className="mt-3 line-clamp-2 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs text-danger" title={p.rejectionReason}>
            {p.rejectionReason}
          </p>
        )}

        {/* Pushes the footer to the bottom so every card in a row is the same height. */}
        <div className="flex-1" />

        <div className="mt-4 space-y-2.5 border-t border-border pt-3.5">
          {(p.status === "pending" || p.status === "verification") && (
            <div className="flex items-center gap-2">
              {p.status === "pending" && <TextAction icon={ShieldCheck} label="Verify" tone="primary" onClick={onVerify} disabled={busy} />}
              <TextAction icon={Check} label="Approve" tone="success" onClick={onApprove} disabled={busy} />
              <TextAction icon={X} label="Reject" tone="danger" onClick={onReject} disabled={busy} />
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <SecondaryAction icon={Eye} label="View" title="View details" onClick={onOpen} />
            <SecondaryAction icon={Pencil} label="Edit" title="Edit provider" onClick={onEdit} />
            <SecondaryAction icon={Trash2} label="Delete" title="Delete provider" tone="danger" onClick={onDelete} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      <div className="skeleton h-32 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
        <div className="skeleton mt-4 h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}
