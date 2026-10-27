"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ExternalLink,
  FileText,
  History,
  IdCard,
  MapPin,
  Play,
  Pencil,
  Phone,
  Radar,
  ShieldCheck,
  VideoOff,
  X,
  ZoomIn,
  Calendar,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Provider } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { digitsOnly, formatDateTime, formatRupees, isPdf } from "@/lib/utils";
import { RejectModal } from "./RejectModal";
import { ImageLightbox } from "./ImageLightbox";
import { VideoModal } from "./VideoModal";

const statusTone = {
  pending: "amber",
  verification: "blue",
  approved: "green",
  rejected: "red",
} as const;

const statusLabel = {
  pending: "⏳ Pending",
  verification: "🔍 Under Verification",
  approved: "✅ Approved",
  rejected: "❌ Rejected",
} as const;

/* ── Card container ─────────────────────────────────── */
function InfoCard({
  icon: Icon,
  iconBg,
  title,
  children,
}: {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface ring-1 ring-border overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
      </div>
      {/* Card body */}
      <div className="p-4">{children}</div>
    </div>
  );
}

const isEmpty = (v: unknown) => v === undefined || v === null || v === "" || v === "—" || (Array.isArray(v) && v.length === 0);

/* ── Single row inside a card ───────────────────────── */
function Row({ label, value }: { label: string; value?: ReactNode }) {
  // Fields the backend didn't send (or sent empty) are simply not shown.
  if (isEmpty(value)) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="min-w-[130px] text-xs font-medium text-muted shrink-0">{label}</span>
      <span className="text-sm break-words font-semibold leading-snug text-foreground">{value}</span>
    </div>
  );
}

/* ── Chip list ──────────────────────────────────────── */
function ChipList({ items, tone = "indigo" }: { items: string[]; tone?: "indigo" | "blue" | "gray" }) {
  if (!items || items.length === 0)
    return <span className="text-sm italic text-subtle">Not provided</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} tone={tone}>
          {item}
        </Badge>
      ))}
    </span>
  );
}

const yesNo = (v: boolean) => (v ? "✅ Yes" : "❌ No");

/* ══════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════ */
// lucide has no brand marks, so the WhatsApp logo is drawn inline.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProviderDetailView({
  provider,
  backHref,
  backLabel,
  editHref,
  onVerify,
  onApprove,
  onReject,
}: {
  provider: Provider;
  backHref: string;
  backLabel: string;
  editHref: string;
  onVerify: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const p = provider;

  // Only documents that actually have a file are shown.
  const docs = p.documents.filter((d) => d.image);
  const phoneOk = p.mobileNumber !== "—";
  const waDigits = digitsOnly(p.whatsappNumber === "—" ? "" : p.whatsappNumber);
  const waNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {backLabel}
      </Link>

      <div className="flex flex-col overflow-hidden rounded-3xl bg-background shadow-sm ring-1 ring-border">

        {/* ── TOP HEADER BAR ── */}
        <div className="relative flex items-center gap-4 px-5 py-4 bg-surface border-b border-border shrink-0">
          {/* Avatar / Photo */}
          <div className="shrink-0">
            {p.kyc.photoImage && !photoFailed ? (
              <button
                type="button"
                onClick={() =>
                  setLightbox({
                    src: p.kyc.photoImage,
                    alt: `${p.fullName} photo`,
                    caption: `${p.fullName} · Applicant Photo`,
                  })
                }
                className="group relative block h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-border"
              >
                <ShimmerImage
                  src={p.kyc.photoImage}
                  alt={`${p.fullName} photo`}
                  onError={() => setPhotoFailed(true)}
                  wrapperClassName="h-16 w-16"
                  imgClassName="transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100 rounded-2xl">
                  <ZoomIn className="h-5 w-5 text-white" />
                </span>
              </button>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3 ring-2 ring-border">
                <Avatar name={p.fullName} color={p.avatarColor} size={56} />
              </div>
            )}
          </div>

          {/* Name + tags */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">{p.fullName}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={statusTone[p.status]} dot>
                {statusLabel[p.status]}
              </Badge>
            </div>
          </div>

          {/* Call / WhatsApp (icons only) */}
          <div className="flex shrink-0 items-center gap-2">
            {[
              {
                href: phoneOk ? `tel:${p.mobileNumber}` : undefined,
                icon: Phone,
                label: "Call",
                number: p.mobileNumber,
                color: "bg-success-soft text-success hover:bg-success hover:text-white",
              },
              {
                href: waNumber ? `https://wa.me/${waNumber}` : undefined,
                icon: WhatsAppIcon,
                label: "WhatsApp",
                number: p.whatsappNumber,
                color: "bg-accent-soft text-accent hover:bg-accent hover:text-white",
              },
            ].map(({ href, icon: Icon, label, number, color }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  title={`${label} ${number}`}
                  aria-label={`${label} ${number}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-border transition active:scale-90 ${color}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ) : null
            )}
          </div>

          <Link
            href={editHref}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-sm font-semibold text-primary ring-1 ring-primary/15 transition hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="space-y-4 p-4 sm:p-5">

          {/* Rejection banner */}
          {p.status === "rejected" && p.rejectionReason && (
            <div className="flex items-start gap-3 rounded-2xl bg-danger-soft p-4 ring-1 ring-danger/20">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-bold text-danger text-sm">Application Rejected</p>
                <p className="mt-1 text-sm text-danger/80">{p.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* ── CONTACT & LOCATION ── */}
          {[p.mobileNumber, p.city, p.area, p.pincode, p.state, p.emirate].some((v) => !isEmpty(v)) && (
          <InfoCard icon={MapPin} iconBg="bg-success-soft text-success" title="📍 Contact & Location">
            <Row label="Mobile Number" value={p.mobileNumber} />
            <Row label="City" value={p.city} />
            <Row label="Area" value={p.area} />
            <Row label="Pincode" value={p.pincode} />
            <Row label="State" value={p.state} />
            <Row label="Emirate" value={p.emirate} />
          </InfoCard>
          )}

          {/* ── WORK PROFILE ── */}
          {(p.categories.length > 0 || p.serviceRadiusKm || p.jobDescription) && (
            <InfoCard icon={Briefcase} iconBg="bg-accent-soft text-accent" title="💼 Work Profile">
              {p.categories.length > 0 && (
                <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <span className="min-w-[130px] text-xs font-medium text-muted shrink-0">Job Categories</span>
                  <ChipList items={p.categories} tone="indigo" />
                </div>
              )}
              {p.serviceRadiusKm ? (
                <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <span className="flex min-w-[130px] shrink-0 items-center gap-1 text-xs font-medium text-muted">
                    <Radar className="h-3 w-3" /> Service Radius
                  </span>
                  <span className="text-sm font-semibold text-foreground">Within {p.serviceRadiusKm} km</span>
                </div>
              ) : null}
              {p.jobDescription && (
                <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm text-foreground leading-relaxed ring-1 ring-border">
                  <p className="text-xs font-medium text-muted mb-1">📝 Job Description</p>
                  {p.jobDescription}
                </div>
              )}
            </InfoCard>
          )}

          {/* ── LAST JOB ── */}
          {p.lastJob && Object.values(p.lastJob).some((v) => !isEmpty(v)) && (
            <InfoCard icon={History} iconBg="bg-warning-soft text-warning" title="🕐 Previous Work Experience">
              <Row label="Job Title" value={p.lastJob.jobTitle} />
              <Row
                label="Duration"
                value={
                  /^\d+(\.\d+)?$/.test(p.lastJob.duration)
                    ? `${p.lastJob.duration} ${p.lastJob.duration === "1" ? "year" : "years"}`
                    : p.lastJob.duration
                }
              />
              <Row label="Work City" value={p.lastJob.workingCity} />
              <Row label="Family Size" value={p.lastJob.familySize} />
              <Row label="Employer Nationality" value={p.lastJob.employerNationality} />
              <Row
                label="Salary"
                value={p.lastJob.salary !== undefined ? `${formatRupees(p.lastJob.salary)} / month` : undefined}
              />
              <Row label="Reason for Leaving" value={p.lastJob.reasonForLeaving} />
            </InfoCard>
          )}

          {/* ── IDENTITY DOCUMENTS ── */}
          {docs.length > 0 && (
          <InfoCard icon={IdCard} iconBg="bg-danger-soft text-danger" title="🪪 Identity & Documents">
            {(
              <div className="space-y-4">
                {docs.map((doc, i) => (
                  <div key={`${doc.type}-${i}`} className="rounded-xl bg-surface-2 p-3.5 ring-1 ring-border">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">{doc.type}</span>
                      <span className="text-[11px] text-subtle">Document {i + 1} of {docs.length}</span>
                    </div>
                    <div className="mt-3">
                      {!doc.image ? (
                        <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border text-sm text-subtle">
                          No file uploaded
                        </div>
                      ) : isPdf(doc.image) ? (
                        <a
                          href={doc.image}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl bg-surface p-4 ring-1 ring-border transition hover:ring-primary"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-soft text-danger">
                            <FileText className="h-5 w-5" />
                          </span>
                          <span className="flex-1 text-sm font-semibold text-foreground">Open {doc.type} (PDF)</span>
                          <ExternalLink className="h-4 w-4 text-muted" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setLightbox({
                              src: doc.image,
                              alt: `${p.fullName} ${doc.type}`,
                              caption: doc.type,
                            })
                          }
                          className="group relative block w-full max-w-xs overflow-hidden rounded-xl ring-1 ring-border"
                        >
                          <ShimmerImage
                            src={doc.image}
                            alt={`${p.fullName} ${doc.type}`}
                            wrapperClassName="h-44 w-full"
                            imgClassName="transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>
          )}

          {/* ── INTRO VIDEO ── */}
          {p.introVideoUrl && (
          <InfoCard icon={VideoOff} iconBg="bg-neutral-soft text-neutral" title="🎥 Intro Video">
            {p.introVideoUrl && (p.introVideoThumbnailUrl || !videoFailed) ? (
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                aria-label={`Play ${p.fullName}'s intro video`}
                className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-border"
              >
                {/* #t=0.1 makes the browser render the first frame as the thumbnail. */}
                {p.introVideoThumbnailUrl ? (
                  <ShimmerImage
                    src={p.introVideoThumbnailUrl}
                    alt={`${p.fullName} intro video thumbnail`}
                    wrapperClassName="h-full w-full"
                    imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <video
                    src={`${p.introVideoUrl}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    onError={() => setVideoFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                  </span>
                </span>
                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
                  Tap to play
                </span>
              </button>
            ) : p.introVideoUrl ? (
              <a
                href={p.introVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm font-medium text-primary hover:underline ring-1 ring-border"
              >
                <ExternalLink className="h-5 w-5" />
                Open video in new tab
              </a>
            ) : null}
          </InfoCard>
          )}

          {/* ── APPLICATION INFO ── */}
          <InfoCard icon={ShieldCheck} iconBg="bg-primary-soft text-primary" title="📋 Application Info">
            <div className="flex items-start gap-3 py-2.5 border-b border-border">
              <span className="min-w-[130px] text-xs font-medium text-muted shrink-0">Status</span>
              <Badge tone={statusTone[p.status]} dot>
                {statusLabel[p.status]}
              </Badge>
            </div>
            <Row label="Account" value={p.isActive ? "🟢 Active" : "⚫ Inactive"} />
            <div className="flex items-start gap-3 py-2.5 border-b border-border">
              <span className="min-w-[130px] text-xs font-medium text-muted shrink-0 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Applied On
              </span>
              <span className="text-sm font-semibold text-foreground">{formatDateTime(p.submittedAt)}</span>
            </div>
            <div className="flex items-start gap-3 py-2.5 border-b border-border">
              <span className="min-w-[130px] text-xs font-medium text-muted shrink-0 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Last Updated
              </span>
              <span className="text-sm font-semibold text-foreground">{formatDateTime(p.updatedAt)}</span>
            </div>
            <Row label="Profile Complete" value={yesNo(p.profileComplete)} />
          </InfoCard>

        </div>{/* end scroll body */}

        {/* ── ACTION FOOTER ── */}
        {(p.status === "pending" || p.status === "verification") && (
          <div className="sticky bottom-0 border-t border-border bg-surface px-5 py-4">
            {/* Helper text */}
            <p className="mb-3 text-center text-sm text-muted">
              {p.status === "pending"
                ? "👆 New request — tap Verify to start the review process."
                : "👆 Documents are under review — Approve or Reject below."}
            </p>
            {actionError && <p className="mb-3 text-center text-sm text-danger">{actionError}</p>}
            <div className="flex gap-3">
              {p.status === "verification" && (
                <Button
                  variant="secondary"
                  className="flex-1 text-danger hover:bg-danger-soft border border-danger/20"
                  onClick={() => setShowRejectModal(true)}
                  disabled={busy}
                >
                  <X className="h-4 w-4" /> ❌ Reject
                </Button>
              )}
              {p.status === "pending" ? (
                <Button
                  className="flex-1"
                  onClick={() => run(() => onVerify(p.id))}
                  disabled={busy}
                >
                  <ShieldCheck className="h-4 w-4" /> 🔍 Verify
                </Button>
              ) : (
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => run(() => onApprove(p.id))}
                  disabled={busy}
                >
                  <Check className="h-4 w-4" /> ✅ Approve
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          providerName={p.fullName}
          onCancel={() => setShowRejectModal(false)}
          onConfirm={(reason) => {
            setShowRejectModal(false);
            void run(() => onReject(p.id, reason));
          }}
        />
      )}

      {videoOpen && p.introVideoUrl && (
        <VideoModal src={p.introVideoUrl} poster={p.introVideoThumbnailUrl} title={`${p.fullName} · intro video`} onClose={() => setVideoOpen(false)} />
      )}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
