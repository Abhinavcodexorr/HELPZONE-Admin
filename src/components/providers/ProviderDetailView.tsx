"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarClock,
  Check,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  IdCard,
  MapPin,
  Pencil,
  Phone,
  Play,
  Quote,
  Radar,
  ShieldCheck,
  Wallet,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import type { Provider } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShimmerImage } from "@/components/ui/ShimmerImage";
import { cn, digitsOnly, formatDateTime, formatRupees, isPdf, timeAgo } from "@/lib/utils";
import { ImageLightbox } from "./ImageLightbox";
import { RejectModal } from "./RejectModal";
import { VideoModal } from "./VideoModal";

const statusTone = { pending: "amber", verification: "blue", approved: "green", rejected: "red" } as const;
const statusLabel = { pending: "New request", verification: "In verification", approved: "Approved", rejected: "Rejected" } as const;

const isEmpty = (v: unknown) => v === undefined || v === null || v === "" || v === "—" || (Array.isArray(v) && v.length === 0);

/* ── Building blocks ───────────────────────────────── */

function Section({
  icon: Icon,
  title,
  tone = "bg-primary-soft text-primary",
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  tone?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-surface ring-1 ring-border", className)}>
      <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3.5 ring-1 ring-border">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold leading-tight text-foreground">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: ReactNode }) {
  if (isEmpty(value)) return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone)}>
          {item}
        </span>
      ))}
    </div>
  );
}

// lucide has no brand marks, so the WhatsApp logo is drawn inline.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ── The page ──────────────────────────────────────── */

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
  const p = provider;
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

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

  const photo = p.kyc.photoImage && !photoFailed ? p.kyc.photoImage : "";
  const place = [p.city !== "—" ? p.city : "", p.area].filter(Boolean).join(" · ");
  const region = [p.state, p.pincode].filter(Boolean).join(" · ");
  const phoneOk = p.mobileNumber !== "—";
  const waDigits = digitsOnly(p.whatsappNumber === "—" ? "" : p.whatsappNumber);
  const waNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
  const docs = p.documents.filter((d) => d.image);
  const job = p.lastJob;
  const jobFilled = (job ? Object.values(job).some((v) => !isEmpty(v)) : false) || !!p.jobDescription;
  const hasWork = p.experienceYears !== null || p.monthlySalary !== undefined || !!p.duration || p.languages.length > 0 || p.skills.length > 0 || !!p.education;
  const canAct = p.status === "pending" || p.status === "verification";

  return (
    <div className="mx-auto w-full max-w-6xl pb-6">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {backLabel}
      </Link>

      {/* ── Hero ── */}
      <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-info/15 sm:h-28" />
        <div className="px-5 pb-5 sm:px-7 sm:pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <div className="shrink-0">
              {photo ? (
                <button
                  type="button"
                  onClick={() => setLightbox({ src: photo, alt: `${p.fullName} photo`, caption: p.fullName })}
                  className="group relative block h-28 w-28 overflow-hidden rounded-2xl ring-4 ring-surface sm:h-32 sm:w-32"
                  aria-label="View photo"
                >
                  <ShimmerImage src={photo} alt={p.fullName} onError={() => setPhotoFailed(true)} wrapperClassName="h-full w-full" imgClassName="transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </span>
                </button>
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-2xl bg-surface-3 ring-4 ring-surface sm:h-32 sm:w-32">
                  <Avatar name={p.fullName} color={p.avatarColor} size={80} />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-bold leading-tight text-foreground">{p.fullName}</h1>
                <Badge tone={statusTone[p.status]} dot>
                  {statusLabel[p.status]}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                {(place || region) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {[place, region].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" /> Applied {timeAgo(p.submittedAt)}
                </span>
              </div>
              {(p.categories.length > 0 || p.serviceRadiusKm) && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {p.categories.map((c) => (
                    <span key={c} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      {c}
                    </span>
                  ))}
                  {p.serviceRadiusKm ? (
                    <span className="flex items-center gap-1 rounded-full bg-info-soft px-3 py-1 text-xs font-semibold text-info">
                      <Radar className="h-3 w-3" /> Within {p.serviceRadiusKm} km
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {phoneOk && (
                <a href={`tel:${p.mobileNumber}`} title={`Call ${p.mobileNumber}`} aria-label="Call" className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success ring-1 ring-border transition hover:bg-success hover:text-white active:scale-90">
                  <Phone className="h-[18px] w-[18px]" />
                </a>
              )}
              {waNumber && (
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" title="WhatsApp" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-border transition hover:bg-accent hover:text-white active:scale-90">
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                </a>
              )}
              <Link href={editHref} className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 active:scale-95">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {p.status === "rejected" && p.rejectionReason && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-danger-soft p-4 ring-1 ring-danger/20">
          <X className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-bold text-danger">Application rejected</p>
            <p className="mt-0.5 text-sm text-danger/80">{p.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="space-y-5 lg:col-span-2">
          {hasWork && (
            <Section icon={Briefcase} title="Work & experience" tone="bg-accent-soft text-accent">
              {(p.experienceYears !== null || p.monthlySalary !== undefined || p.duration || p.education) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {p.experienceYears !== null && <Stat icon={GraduationCap} label="Experience" value={`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`} />}
                  {p.monthlySalary !== undefined && <Stat icon={Wallet} label="Expected salary" value={`${formatRupees(p.monthlySalary)} / mo`} />}
                  {p.duration && <Stat icon={CalendarClock} label="Duration" value={p.duration} />}
                  {p.education && <Stat icon={BookOpen} label="Education" value={p.education} />}
                </div>
              )}
              {p.languages.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Languages</p>
                  <Chips items={p.languages} tone="bg-info-soft text-info" />
                </div>
              )}
              {p.skills.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Skills</p>
                  <Chips items={p.skills} tone="bg-surface-3 text-fg-2" />
                </div>
              )}
            </Section>
          )}

          {/* Previous job: highlighted */}
          {jobFilled && (
            <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-surface to-surface ring-2 ring-amber-300/70 dark:from-amber-400/10 dark:ring-amber-400/40">
              <header className="flex items-center gap-3 bg-amber-100/70 px-5 py-3.5 dark:bg-amber-400/15">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-sm">
                  <History className="h-[18px] w-[18px]" />
                </span>
                <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">Previous job</h2>
                {job?.duration && (
                  <span className="ml-auto rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
                    {/^\d+(\.\d+)?$/.test(job.duration) ? `${job.duration} ${job.duration === "1" ? "year" : "years"}` : job.duration}
                  </span>
                )}
              </header>
              <div className="p-5">
                {job?.jobTitle && <p className="text-xl font-bold text-foreground">{job.jobTitle}</p>}
                <dl className={cn("grid gap-4 sm:grid-cols-3", job?.jobTitle && "mt-4")}>
                  <Detail label="Work city" value={job?.workingCity} />
                  <Detail label="Family size" value={job?.familySize} />
                  <Detail label="Salary" value={job?.salary !== undefined ? `${formatRupees(job.salary)} / month` : undefined} />
                </dl>
                {p.jobDescription && (
                  <div className="mt-4 rounded-xl bg-surface p-3.5 ring-1 ring-amber-300/60">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Job description</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-foreground">{p.jobDescription}</p>
                  </div>
                )}
                {job?.reasonForLeaving && (
                  <div className="mt-4 flex gap-2.5 rounded-xl bg-surface p-3.5 ring-1 ring-amber-300/60">
                    <Quote className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Reason for leaving</p>
                      <p className="mt-0.5 text-sm text-foreground">{job.reasonForLeaving}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {docs.length > 0 && (
            <Section icon={IdCard} title="Documents" tone="bg-danger-soft text-danger">
              <div className="grid gap-4 sm:grid-cols-2">
                {docs.map((doc, i) => (
                  <div key={`${doc.type}-${i}`}>
                    <p className="mb-1.5 text-xs font-semibold text-fg-2">{doc.type}</p>
                    {isPdf(doc.image) ? (
                      <a href={doc.image} target="_blank" rel="noreferrer" className="flex h-44 flex-col items-center justify-center gap-2 rounded-xl bg-surface-2 text-sm font-semibold text-primary ring-1 ring-border transition hover:ring-primary">
                        <FileText className="h-8 w-8" />
                        Open PDF <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightbox({ src: doc.image, alt: `${p.fullName} ${doc.type}`, caption: doc.type })}
                        className="group relative block w-full overflow-hidden rounded-xl ring-1 ring-border"
                      >
                        <ShimmerImage src={doc.image} alt={`${p.fullName} ${doc.type}`} wrapperClassName="h-44 w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {p.introVideoUrl && (
            <Section icon={Play} title="Intro video" tone="bg-neutral-soft text-neutral">
              <button type="button" onClick={() => setVideoOpen(true)} aria-label={`Play ${p.fullName}'s intro video`} className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-border">
                {p.introVideoThumbnailUrl ? (
                  <ShimmerImage src={p.introVideoThumbnailUrl} alt="Intro video thumbnail" wrapperClassName="h-full w-full" imgClassName="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <video src={`${p.introVideoUrl}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/45">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 translate-x-0.5 fill-current" />
                  </span>
                </span>
              </button>
            </Section>
          )}
        </div>

        {/* ── Side column ── */}
        <div className="space-y-5">
          <Section icon={MapPin} title="Contact & location" tone="bg-success-soft text-success">
            <dl className="space-y-4">
              <Detail label="Mobile" value={phoneOk ? p.mobileNumber : undefined} />
              <Detail label="WhatsApp" value={p.whatsappNumber} />
              <Detail label="City" value={p.city} />
              <Detail label="Area" value={p.area} />
              <Detail label="Pincode" value={p.pincode} />
              <Detail label="State" value={p.state} />
              <Detail label="Emirate" value={p.emirate} />
            </dl>
          </Section>

          <Section icon={ShieldCheck} title="Application" tone="bg-primary-soft text-primary">
            <dl className="space-y-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Status</dt>
                <dd className="mt-1">
                  <Badge tone={statusTone[p.status]} dot>
                    {statusLabel[p.status]}
                  </Badge>
                </dd>
              </div>
              <Detail label="Account" value={p.isActive ? "Active" : "Inactive"} />
              <Detail label="Applied on" value={formatDateTime(p.submittedAt)} />
              <Detail label="Last updated" value={formatDateTime(p.updatedAt)} />
              <Detail label="Profile complete" value={p.profileComplete ? "Yes" : "No"} />
            </dl>
          </Section>
        </div>
      </div>

      {/* ── Review actions ── */}
      {canAct && (
        <div className="sticky bottom-3 z-20 mt-5 rounded-2xl bg-surface/95 px-4 py-3 shadow-lg ring-1 ring-border backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-muted">
              {p.status === "pending" ? "New request. Verify to start the review." : "Documents are under review. Approve or reject."}
            </p>
            {actionError && <p className="text-sm text-danger">{actionError}</p>}
            {p.status === "verification" && (
              <Button variant="secondary" className="text-danger" onClick={() => setShowReject(true)} disabled={busy}>
                <X className="h-4 w-4" /> Reject
              </Button>
            )}
            {p.status === "pending" ? (
              <Button onClick={() => run(() => onVerify(p.id))} disabled={busy}>
                <ShieldCheck className="h-4 w-4" /> {busy ? "Working…" : "Verify"}
              </Button>
            ) : (
              <Button variant="success" onClick={() => run(() => onApprove(p.id))} disabled={busy}>
                <Check className="h-4 w-4" /> {busy ? "Working…" : "Approve"}
              </Button>
            )}
          </div>
        </div>
      )}

      {showReject && (
        <RejectModal
          providerName={p.fullName}
          onCancel={() => setShowReject(false)}
          onConfirm={(reason) => {
            setShowReject(false);
            void run(() => onReject(p.id, reason));
          }}
        />
      )}
      {videoOpen && p.introVideoUrl && <VideoModal src={p.introVideoUrl} poster={p.introVideoThumbnailUrl} title={`${p.fullName} · intro video`} onClose={() => setVideoOpen(false)} />}
      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} caption={lightbox.caption} onClose={() => setLightbox(null)} />}
    </div>
  );
}
