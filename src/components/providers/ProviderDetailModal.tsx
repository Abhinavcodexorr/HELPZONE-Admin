"use client";

import { useState, type ReactNode } from "react";
import {
  Briefcase,
  Check,
  ExternalLink,
  FileText,
  GraduationCap,
  History,
  IdCard,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
  VideoOff,
  X,
  ZoomIn,
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

const statusTone = { pending: "amber", approved: "green", rejected: "red" } as const;

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </h4>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children?: ReactNode; wide?: boolean }) {
  const empty = children === undefined || children === null || children === "" || children === "—";
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm ${empty ? "text-subtle" : "font-medium text-foreground"}`}>
        {empty ? "—" : children}
      </dd>
    </div>
  );
}

function Chips({ items, tone = "indigo" }: { items: string[]; tone?: "indigo" | "blue" | "gray" }) {
  if (items.length === 0) return <>—</>;
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

const yesNo = (value: boolean) => (value ? "Yes" : "No");

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
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const p = provider;

  const phoneOk = p.mobileNumber !== "—";
  const waDigits = digitsOnly(p.whatsappNumber === "—" ? "" : p.whatsappNumber);
  const waNumber = waDigits.length === 10 ? `91${waDigits}` : waDigits;
  const idIsPdf = isPdf(p.kyc.idDocumentImage);
  const subtitle = [p.gender, p.age ? `${p.age} yrs` : null, p.nationality !== "—" ? p.nationality : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative flex max-h-[94vh] w-full max-w-4xl animate-pop-in flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-border">
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-muted shadow-sm ring-1 ring-border backdrop-blur transition hover:text-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid flex-1 overflow-y-auto md:grid-cols-[290px_minmax(0,1fr)]">
          {/* ---------- Left: identity, contact, video ---------- */}
          <aside className="space-y-5 border-b border-border bg-surface-2 p-6 md:sticky md:top-0 md:max-h-[calc(94vh-4.5rem)] md:self-start md:overflow-y-auto md:border-b-0 md:border-r">
            <div>
              {p.kyc.photoImage && !photoFailed ? (
                <button
                  type="button"
                  onClick={() => setLightbox({ src: p.kyc.photoImage, alt: `${p.fullName} photo`, caption: `${p.fullName} · applicant photo` })}
                  className="group relative block w-full overflow-hidden rounded-2xl ring-1 ring-border"
                >
                  <ShimmerImage
                    src={p.kyc.photoImage}
                    alt={`${p.fullName} photo`}
                    onError={() => setPhotoFailed(true)}
                    wrapperClassName="aspect-[4/3] w-full md:aspect-square"
                    imgClassName="transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </span>
                </button>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-surface-3 md:aspect-square">
                  <Avatar name={p.fullName} color={p.avatarColor} size={96} />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold leading-tight text-foreground">{p.fullName}</h3>
              <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone={statusTone[p.status]} dot>
                  {p.status}
                </Badge>
                <Badge tone={p.isActive ? "green" : "gray"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                <Badge tone={p.profileComplete ? "blue" : "gray"}>
                  {p.profileComplete ? "Profile complete" : "Profile incomplete"}
                </Badge>
              </div>
              {p.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.categories.map((c) => (
                    <Badge key={c} tone="indigo">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { href: phoneOk ? `tel:${p.mobileNumber}` : undefined, icon: Phone, label: "Call" },
                { href: waNumber ? `https://wa.me/${waNumber}` : undefined, icon: MessageCircle, label: "WhatsApp" },
                { href: p.email ? `mailto:${p.email}` : undefined, icon: Mail, label: "Email" },
              ].map(({ href, icon: Icon, label }) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 rounded-xl bg-surface py-2.5 text-xs font-medium text-fg-2 ring-1 ring-border transition hover:-translate-y-0.5 hover:text-primary hover:shadow-md"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ) : (
                  <span
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl bg-surface-3 py-2.5 text-xs font-medium text-subtle"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                ),
              )}
            </div>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Intro video</h4>
              {p.introVideoUrl && !videoFailed ? (
                <video
                  src={`${p.introVideoUrl}#t=0.1`}
                  controls
                  preload="metadata"
                  playsInline
                  onError={() => setVideoFailed(true)}
                  className="aspect-video w-full rounded-xl bg-black ring-1 ring-border"
                />
              ) : p.introVideoUrl ? (
                <a
                  href={p.introVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl bg-surface-3 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open video in new tab
                </a>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface text-xs text-subtle">
                  <VideoOff className="h-5 w-5" />
                  No intro video uploaded
                </div>
              )}
            </div>
          </aside>

          {/* ---------- Right: every detail ---------- */}
          <div className="space-y-7 p-6 pr-14 md:pr-6">
            {p.status === "rejected" && p.rejectionReason && (
              <div className="rounded-xl bg-danger-soft p-3.5 text-sm text-danger">
                <p className="font-semibold">Application rejected</p>
                <p className="mt-0.5">{p.rejectionReason}</p>
              </div>
            )}

            <Section icon={User} title="Personal details">
              <Field label="Full name">{p.fullName}</Field>
              <Field label="Gender">{p.gender}</Field>
              <Field label="Age">{p.age ? `${p.age} years` : undefined}</Field>
              <Field label="Nationality">{p.nationality}</Field>
              <Field label="Marital status">{p.maritalStatus}</Field>
              <Field label="Religion">{p.religion}</Field>
              <Field label="Languages" wide>
                <Chips items={p.languages} tone="blue" />
              </Field>
            </Section>

            <Section icon={MapPin} title="Contact & location">
              <Field label="Mobile">{p.mobileNumber}</Field>
              <Field label="WhatsApp">{p.whatsappNumber}</Field>
              <Field label="Email" wide>
                {p.email}
              </Field>
              <Field label="Area">{p.area}</Field>
              <Field label="City">{p.city}</Field>
              {p.emirate && <Field label="Emirate">{p.emirate}</Field>}
            </Section>

            <Section icon={Briefcase} title="Work profile">
              <Field label="Categories" wide>
                <Chips items={p.categories} />
              </Field>
              <Field label="Experience">
                {`${p.experienceYears} ${p.experienceYears === 1 ? "year" : "years"}`}
              </Field>
              <Field label="Preferred job">{p.preferredJob}</Field>
              <Field label="Job type">{p.duration}</Field>
              <Field label="Availability" wide>
                {p.availability}
              </Field>
              <Field label="Skills" wide>
                <Chips items={p.skills} tone="gray" />
              </Field>
              <Field label="About" wide>
                {p.bio}
              </Field>
              <Field label="Job description" wide>
                {p.jobDescription}
              </Field>
            </Section>

            {p.lastJob && (
              <Section icon={History} title="Last working experience">
                <Field label="Job title">{p.lastJob.jobTitle}</Field>
                <Field label="Duration">{p.lastJob.duration}</Field>
                <Field label="Working city">{p.lastJob.workingCity}</Field>
                <Field label="Family size">{p.lastJob.familySize}</Field>
                <Field label="Employer nationality">{p.lastJob.employerNationality}</Field>
                <Field label="Salary">
                  {p.lastJob.salary !== undefined ? `${formatRupees(p.lastJob.salary)} / month` : undefined}
                </Field>
                <Field label="Reason for leaving" wide>
                  {p.lastJob.reasonForLeaving}
                </Field>
              </Section>
            )}

            <Section icon={GraduationCap} title="Education">
              <Field label="Education">{p.education}</Field>
              <Field label="Certificate">{p.certificate}</Field>
            </Section>

            <Section icon={IdCard} title="Identity & documents">
              <Field label="ID type">{p.kyc.idType}</Field>
              <Field label="ID number">{p.kyc.idNumber}</Field>
              <Field label="PAN number">{p.panNumber}</Field>
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs text-muted">ID document</p>
                {!p.kyc.idDocumentImage ? (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border text-xs text-subtle">
                    No document uploaded
                  </div>
                ) : idIsPdf ? (
                  <a
                    href={p.kyc.idDocumentImage}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-surface-2 p-4 ring-1 ring-border transition hover:ring-primary"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-soft text-danger">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-foreground">Open ID document (PDF)</span>
                    <ExternalLink className="ml-auto h-4 w-4 text-muted" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setLightbox({
                        src: p.kyc.idDocumentImage,
                        alt: `${p.fullName} ${p.kyc.idType}`,
                        caption: `${p.kyc.idType} · ${p.kyc.idNumber}`,
                      })
                    }
                    className="group relative block w-full max-w-sm overflow-hidden rounded-xl ring-1 ring-border"
                  >
                    <ShimmerImage
                      src={p.kyc.idDocumentImage}
                      alt={`${p.fullName} ${p.kyc.idType}`}
                      wrapperClassName="h-44 w-full"
                      imgClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </span>
                  </button>
                )}
              </div>
            </Section>

            <Section icon={ShieldCheck} title="Application">
              <Field label="Status">
                <Badge tone={statusTone[p.status]} dot>
                  {p.status}
                </Badge>
              </Field>
              <Field label="Account">{p.isActive ? "Active" : "Inactive"}</Field>
              <Field label="Applied on">{formatDateTime(p.submittedAt)}</Field>
              <Field label="Last updated">{formatDateTime(p.updatedAt)}</Field>
              <Field label="Profile completed">{yesNo(p.profileComplete)}</Field>
            </Section>
          </div>
        </div>

        {p.status === "pending" && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface px-6 py-4">
            <p className="hidden text-sm text-muted sm:block">Review the details and documents, then decide.</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="secondary"
                className="flex-1 text-danger hover:bg-danger-soft sm:flex-none"
                onClick={() => setShowRejectModal(true)}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                variant="success"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  onApprove(p.id);
                  onClose();
                }}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
            </div>
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
