"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Flag,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import type { ModerationAction, User, UserDetail, UserNote } from "@/types";

const bookingTone: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
  completed: "green",
  pending: "amber",
  confirmed: "blue",
  in_progress: "blue",
  cancelled: "red",
};

const statTiles = [
  { key: "total", label: "Total" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "cancelled", label: "Cancelled" },
];

const logStyle: Record<ModerationAction, { label: string; dot: string }> = {
  blocked: { label: "Blocked", dot: "bg-danger-solid" },
  unblocked: { label: "Unblocked", dot: "bg-success-solid" },
  auto_unblocked: { label: "Block ended automatically", dot: "bg-success-solid" },
  flagged: { label: "Flagged", dot: "bg-amber-400" },
  unflagged: { label: "Flag removed", dot: "bg-neutral" },
  edited: { label: "Details edited", dot: "bg-blue-500" },
};

type Tab = "overview" | "notes" | "history";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
      <span className="w-24 shrink-0 text-xs font-medium text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

const chipButton =
  "inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg-2 ring-1 ring-border transition hover:bg-surface-3 active:scale-95";

export function UserDetailModal({
  user,
  busy,
  loadDetail,
  onClose,
  onBlock,
  onUnblock,
  onFlag,
  onUnflag,
  onEdit,
  onDelete,
  addNote,
  deleteNote,
}: {
  user: User;
  busy: boolean;
  loadDetail: (id: string) => Promise<UserDetail>;
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onFlag: () => void;
  onUnflag: () => void;
  onEdit: () => void;
  onDelete: () => void;
  addNote: (id: string, text: string) => Promise<UserNote[]>;
  deleteNote: (id: string, noteId: string) => Promise<UserNote[]>;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const blocked = user.status === "inactive";

  // Load once, and again (without a skeleton) whenever the account's standing changes so the history stays current.
  useEffect(() => {
    let cancelled = false;
    loadDetail(user.id)
      .then((d) => !cancelled && (setDetail(d), setFailed(false)))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [user.id, user.status, user.flagged, user.name, user.phone, loadDetail]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setNotes = (notes: UserNote[]) => setDetail((d) => (d ? { ...d, adminNotes: notes } : d));

  async function submitNote() {
    if (!noteText.trim()) return;
    setNoteBusy(true);
    setNoteError(null);
    try {
      setNotes(await addNote(user.id, noteText.trim()));
      setNoteText("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Couldn't save the note.");
    } finally {
      setNoteBusy(false);
    }
  }

  async function removeNote(noteId: string) {
    try {
      setNotes(await deleteNote(user.id, noteId));
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Couldn't delete the note.");
    }
  }

  const phoneDigits = user.phone.replace(/\D/g, "");
  const hasPhone = user.phone !== "—";
  const hasEmail = user.email !== "—";
  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "overview", label: "Overview" },
    { value: "notes", label: "Notes", count: detail?.adminNotes.length ?? user.noteCount },
    { value: "history", label: "History", count: detail?.moderationLog.length },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-lg animate-pop-in flex-col overflow-hidden rounded-2xl bg-surface shadow-xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-lg p-1 text-subtle hover:bg-surface-3">
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto p-6 pb-4">
          <div className="flex items-center gap-3.5 pr-6">
            <Avatar name={user.name} color={user.avatarColor} size={52} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">{user.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={blocked ? "red" : "green"} dot>
                  {blocked ? "Blocked" : "Active"}
                </Badge>
                {user.flagged && (
                  <Badge tone="amber">
                    <Flag className="h-3 w-3" /> Flagged
                  </Badge>
                )}
                <span className="text-xs text-muted">Joined {formatDate(user.joinedAt)}</span>
              </div>
            </div>
          </div>

          {blocked && (
            <div className="mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
              <p className="flex items-center gap-1.5 font-semibold">
                <Ban className="h-4 w-4" /> Blocked{user.blockedAt ? ` · ${timeAgo(user.blockedAt)}` : ""}
              </p>
              <p className="mt-1 text-xs">{user.blockReason || "No reason recorded."}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-medium">
                <Clock className="h-3 w-3" />
                {user.blockedUntil ? `Unblocks automatically on ${formatDateTime(user.blockedUntil)}` : "Stays blocked until you unblock them"}
              </p>
            </div>
          )}
          {user.flagged && (
            <div className="mt-3 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
              <p className="flex items-center gap-1.5 font-semibold">
                <Flag className="h-4 w-4" /> On the watch list
              </p>
              <p className="mt-1 text-xs">{user.flagReason || "No reason recorded."}</p>
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
            <button className={chipButton} onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button className={cn(chipButton, user.flagged && "bg-warning-soft text-warning")} onClick={user.flagged ? onUnflag : onFlag} disabled={busy}>
              <Flag className="h-3.5 w-3.5" /> {user.flagged ? "Remove flag" : "Flag"}
            </button>
          </div>

          <div role="tablist" className="mt-5 flex gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-border">
            {tabs.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition",
                  tab === t.value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                )}
              >
                {t.label}
                {t.count ? <span className="rounded-full bg-primary-soft px-1.5 text-[10px] text-primary">{t.count}</span> : null}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <>
              <div className="mt-4 rounded-xl bg-surface-2 px-4 ring-1 ring-border">
                <Row label="Email">{user.email}</Row>
                <Row label="Phone">{user.phone}</Row>
                <Row label="City">{user.city}</Row>
                {user.address && <Row label="Address">{user.address}</Row>}
                <Row label="Joined">{formatDateTime(user.joinedAt)}</Row>
                <Row label="Last booking">{user.lastBookingAt ? formatDate(user.lastBookingAt) : "No bookings yet"}</Row>
              </div>

              <h4 className="mb-2 mt-5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
                <Calendar className="h-3.5 w-3.5" /> Bookings
              </h4>
              {failed && !detail ? (
                <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-subtle ring-1 ring-border">Couldn&apos;t load booking history.</p>
              ) : !detail ? (
                <Skeleton className="h-28 w-full rounded-xl" />
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {statTiles.map((t) => (
                      <div key={t.key} className="rounded-xl bg-surface-2 px-2 py-2.5 text-center ring-1 ring-border">
                        <p className="text-lg font-semibold tabular-nums text-foreground">{detail.bookingStats[t.key] ?? 0}</p>
                        <p className="text-[11px] text-muted">{t.label}</p>
                      </div>
                    ))}
                  </div>
                  {detail.recentBookings.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-subtle ring-1 ring-border">No bookings yet.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border rounded-xl ring-1 ring-border">
                      {detail.recentBookings.map((b) => (
                        <li key={b.id} className="flex items-center gap-3 px-3.5 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{b.providerName ?? "Provider removed"}</p>
                            <p className="flex items-center gap-1 text-xs text-muted">
                              {formatDate(b.scheduledDate)}
                              {b.providerCity && (
                                <>
                                  · <MapPin className="h-3 w-3" /> {b.providerCity}
                                </>
                              )}
                            </p>
                          </div>
                          <Badge tone={bookingTone[b.status] ?? "gray"}>{b.status.replace("_", " ")}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}

          {tab === "notes" && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs text-muted">
                <StickyNote className="h-3.5 w-3.5" /> Private notes. Only admins see them.
              </p>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="e.g. Called on Monday, will pay on time"
                className="w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm text-fg-2 placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-danger">{noteError}</span>
                <Button size="sm" onClick={submitNote} disabled={noteBusy || !noteText.trim()}>
                  {noteBusy ? "Saving…" : "Add note"}
                </Button>
              </div>
              {!detail ? (
                <Skeleton className="mt-3 h-16 w-full rounded-xl" />
              ) : detail.adminNotes.length === 0 ? (
                <p className="mt-3 rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-subtle ring-1 ring-border">No notes yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {detail.adminNotes.map((n) => (
                    <li key={n._id} className="group rounded-xl bg-surface-2 px-3.5 py-3 ring-1 ring-border">
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">{n.text}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
                        <span>{formatDateTime(n.at)}</span>
                        <button onClick={() => removeNote(n._id)} className="font-semibold text-danger opacity-70 hover:opacity-100">
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "history" && (
            <div className="mt-4">
              {!detail ? (
                <Skeleton className="h-24 w-full rounded-xl" />
              ) : detail.moderationLog.length === 0 ? (
                <p className="rounded-xl bg-surface-2 px-4 py-6 text-center text-sm text-subtle ring-1 ring-border">
                  Nothing yet. Blocks, flags and edits will be listed here.
                </p>
              ) : (
                <ol className="relative ml-2 space-y-4 border-l border-border pl-5">
                  {detail.moderationLog.map((entry, i) => {
                    const style = logStyle[entry.action] ?? { label: entry.action, dot: "bg-neutral" };
                    return (
                      <li key={`${entry.at}-${i}`} className="relative">
                        <span className={cn("absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-surface", style.dot)} />
                        <p className="text-sm font-semibold text-foreground">{style.label}</p>
                        {entry.reason && <p className="text-xs text-fg-2">{entry.reason}</p>}
                        {entry.until && <p className="text-xs text-muted">Until {formatDateTime(entry.until)}</p>}
                        <p className="text-[11px] text-muted">{formatDateTime(entry.at)}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-surface px-6 py-4">
          <button onClick={onDelete} className="mr-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-danger hover:bg-danger-soft">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
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
