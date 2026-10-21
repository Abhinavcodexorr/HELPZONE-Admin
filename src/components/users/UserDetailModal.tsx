"use client";

import { useEffect, useState } from "react";
import { Ban, CalendarClock, CheckCircle2, Clock, Copy, Mail, Phone, ShieldCheck, Sparkles, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, formatDateTime, formatRupees, timeAgo } from "@/lib/utils";
import type { Subscription, User, UserDetail } from "@/types";

const planTone: Record<Subscription["status"], "green" | "blue" | "gray" | "red"> = {
  active: "green",
  upcoming: "blue",
  expired: "gray",
  cancelled: "red",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
      <span className="w-20 shrink-0 text-xs font-medium text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

const chipButton =
  "inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg-2 ring-1 ring-border transition hover:bg-surface-3 active:scale-95";

function PlanCard({ plan }: { plan: Subscription }) {
  return (
    <div className="rounded-xl bg-primary-soft p-4 ring-1 ring-primary/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Current plan
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-foreground">{plan.planName}</p>
        </div>
        <Badge tone="green" dot>
          Active
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface px-2 py-2 ring-1 ring-border">
          <dd className="text-sm font-semibold tabular-nums text-foreground">{formatRupees(plan.price)}</dd>
          <dt className="text-[11px] text-muted">Paid</dt>
        </div>
        <div className="rounded-lg bg-surface px-2 py-2 ring-1 ring-border">
          <dd className="text-sm font-semibold tabular-nums text-foreground">{formatDate(plan.expiresAt)}</dd>
          <dt className="text-[11px] text-muted">Expires</dt>
        </div>
        <div className="rounded-lg bg-surface px-2 py-2 ring-1 ring-border">
          <dd className="text-sm font-semibold tabular-nums text-foreground">{plan.daysLeft}</dd>
          <dt className="text-[11px] text-muted">{plan.daysLeft === 1 ? "Day left" : "Days left"}</dt>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-muted">
        {plan.durationDays}-day plan · started {formatDate(plan.startsAt)}
      </p>
    </div>
  );
}

export function UserDetailModal({
  user,
  busy,
  loadDetail,
  onClose,
  onBlock,
  onUnblock,
}: {
  user: User;
  busy: boolean;
  loadDetail: (id: string) => Promise<UserDetail>;
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const blocked = user.status === "inactive";

  useEffect(() => {
    let cancelled = false;
    loadDetail(user.id)
      .then((d) => !cancelled && (setDetail(d), setFailed(false)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [user.id, user.status, loadDetail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const phoneDigits = user.phone.replace(/\D/g, "");
  const hasPhone = user.phone !== "—";
  const hasEmail = user.email !== "—";
  const sub = detail?.subscription;
  const past = (sub?.history ?? []).filter((s) => s.id !== sub?.current?.id);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-md animate-pop-in flex-col overflow-hidden rounded-2xl bg-surface shadow-xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-lg p-1 text-subtle hover:bg-surface-3">
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto p-6">
          <div className="flex items-center gap-3.5 pr-6">
            <Avatar name={user.name} color={user.avatarColor} size={52} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">{user.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={blocked ? "red" : "green"} dot>
                  {blocked ? "Blocked" : "Active"}
                </Badge>
                <span className="text-xs text-muted">Joined {formatDate(user.joinedAt)}</span>
              </div>
            </div>
          </div>

          {blocked && (
            <div className="mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
              <p className="flex items-center gap-1.5 font-semibold">
                <Ban className="h-4 w-4" /> Blocked{user.blockedAt ? ` · ${timeAgo(user.blockedAt)}` : ""}
              </p>
              {user.blockReason && <p className="mt-1 text-xs">{user.blockReason}</p>}
              <p className="mt-1 flex items-center gap-1 text-xs font-medium">
                <Clock className="h-3 w-3" />
                {user.blockedUntil ? `Unblocks automatically on ${formatDateTime(user.blockedUntil)}` : "Stays blocked until you unblock them"}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {hasPhone && (
              <a href={`tel:${user.phone}`} className={chipButton}>
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
            {hasPhone && phoneDigits.length >= 10 && (
              <a href={`https://wa.me/${phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits}`} target="_blank" rel="noreferrer" className={chipButton}>
                WhatsApp
              </a>
            )}
            {hasEmail && (
              <a href={`mailto:${user.email}`} className={chipButton}>
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            )}
            {hasEmail && (
              <button
                className={chipButton}
                onClick={() =>
                  navigator.clipboard?.writeText(user.email).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy email"}
              </button>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-surface-2 px-4 ring-1 ring-border">
            <Row label="Email">{user.email}</Row>
            <Row label="Phone">{user.phone}</Row>
            <Row label="City">{user.city}</Row>
            {user.address && <Row label="Address">{user.address}</Row>}
          </div>

          <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-subtle">Subscription</h4>
          {failed && !detail ? (
            <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-subtle ring-1 ring-border">Couldn&apos;t load the plan.</p>
          ) : !detail ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <div className="space-y-3">
              {sub?.current ? (
                <PlanCard plan={sub.current} />
              ) : (
                <p className="rounded-xl bg-surface-2 px-4 py-5 text-center text-sm text-subtle ring-1 ring-border">
                  {past.length > 0 || sub?.upcoming ? "No active plan right now." : "Hasn't bought a plan yet."}
                </p>
              )}

              {sub?.upcoming && (
                <div className="flex items-center gap-3 rounded-xl bg-info-soft px-3.5 py-3 text-sm text-info">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  <p className="min-w-0 flex-1">
                    <span className="font-semibold">{sub.upcoming.planName}</span> starts {formatDate(sub.upcoming.startsAt)}
                  </p>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">Earlier plans</p>
                  <ul className="divide-y divide-border rounded-xl ring-1 ring-border">
                    {past.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 px-3.5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{p.planName}</p>
                          <p className="text-xs text-muted">
                            {formatDate(p.startsAt)} – {formatDate(p.expiresAt)} · {formatRupees(p.price)}
                          </p>
                        </div>
                        <Badge tone={planTone[p.status]}>{p.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {blocked ? (
            <Button variant="success" onClick={onUnblock} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" /> {busy ? "Unblocking…" : "Unblock"}
            </Button>
          ) : (
            <Button variant="danger" onClick={onBlock} disabled={busy}>
              <ShieldCheck className="h-4 w-4" /> Block
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
