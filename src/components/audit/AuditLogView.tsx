"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ScrollText, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { flagEmoji } from "@/lib/countries";
import { cn, formatDateTime } from "@/lib/utils";
import { useCountry } from "@/store/CountryContext";

interface LogRow {
  id: string;
  at: string;
  actor: { email?: string; name?: string; role?: string; source?: string };
  action: string;
  resource?: string;
  resourceId?: string;
  resourceLabel?: string;
  country?: string;
  method?: string;
  path?: string;
  status?: number;
  success: boolean;
  message?: string;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

interface Result {
  data: LogRow[];
  total: number;
  page: number;
  pages: number;
  facets: { actors: string[]; actions: string[] };
}

const PAGE_SIZE = 25;

// Readable names for the actions the backend records.
const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.logout": "Signed out",
  "auth.sign_out_everywhere": "Signed out everywhere",
  "auth.country_switch": "Switched country",
  "auth.password_changed": "Changed own password",
  "auth.session_revoked": "Session ended",
  "access.denied": "Blocked (no permission)",
  "provider.view": "Viewed a provider",
  "provider.verify": "Started verification",
  "provider.approve": "Approved a provider",
  "provider.reject": "Rejected a provider",
  "provider.update": "Edited a provider",
  "provider.delete": "Deleted a provider",
  "customer.view": "Viewed a customer",
  "customer.update": "Edited a customer",
  "customer.flag": "Flagged a customer",
  "customer.note_add": "Added a customer note",
  "customer.note_delete": "Deleted a customer note",
  "customer.activate": "Unblocked a customer",
  "customer.deactivate": "Blocked a customer",
  "customer.delete": "Deleted a customer",
  "subscription.grant": "Granted a subscription",
  "subscription.cancel": "Cancelled a subscription",
  "service.create": "Created a service",
  "service.update": "Edited a service",
  "service.activate": "Activated a service",
  "service.deactivate": "Deactivated a service",
  "service.delete": "Deleted a service",
  "plan.create": "Created a plan",
  "plan.update": "Edited a plan",
  "plan.activate": "Activated a plan",
  "plan.deactivate": "Deactivated a plan",
  "plan.delete": "Deleted a plan",
  "admin.create": "Created an admin",
  "admin.update": "Edited an admin",
  "admin.delete": "Deleted an admin",
};
const labelFor = (action: string) => ACTION_LABELS[action] ?? action;

const selectClass =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const show = (v: unknown) => (v === undefined || v === null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

function toneFor(row: LogRow): "green" | "red" | "amber" | "blue" {
  if (row.action === "access.denied") return "amber";
  if (!row.success) return "red";
  if (row.action.startsWith("auth.")) return "blue";
  return "green";
}

export function AuditLogView() {
  const { countries, role } = useCountry();
  const [query, setQuery] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [country, setCountry] = useState("");
  const [result, setResult] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (query.trim()) params.set("q", query.trim());
    if (actor) params.set("actor", actor);
    if (action) params.set("action", action);
    if (country) params.set("country", country);
    if (result) params.set("success", result);
    // Whole days in the admin's own time zone.
    if (from) params.set("from", new Date(`${from}T00:00:00`).toISOString());
    if (to) params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
    try {
      const res = await fetch(`/api/audit-logs?${params}`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as Partial<Result> & { message?: string; success?: boolean };
      if (mine !== seq.current) return;
      if (!res.ok || json.success === false) throw new Error(res.status === 403 ? "You don't have permission to view the audit log." : json.message || "Couldn't load the audit log.");
      setData(json as Result);
    } catch (err) {
      if (mine === seq.current) setError(err instanceof Error ? err.message : "Couldn't load the audit log.");
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [page, query, actor, action, country, result, from, to]);

  // Typing in the search box waits a moment before asking the server.
  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader
        icon={ScrollText}
        title="Audit log"
        description={role === "superadmin" ? "Everything admins did and tried to do, in every country" : "What admins did and tried to do in your countries"}
      />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={cn(selectClass, "sm:col-span-2")}
            placeholder="Search person, record, action or IP"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
          <select className={selectClass} value={actor} onChange={(e) => reset(setActor)(e.target.value)} aria-label="Admin">
            <option value="">All admins</option>
            {(data?.facets.actors ?? []).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className={selectClass} value={action} onChange={(e) => reset(setAction)(e.target.value)} aria-label="Action">
            <option value="">All actions</option>
            {(data?.facets.actions ?? []).map((a) => (
              <option key={a} value={a}>{labelFor(a)}</option>
            ))}
          </select>
          <select className={selectClass} value={country} onChange={(e) => reset(setCountry)(e.target.value)} aria-label="Country">
            <option value="">{role === "superadmin" ? "All countries" : "All my countries"}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
            ))}
          </select>
          <select className={selectClass} value={result} onChange={(e) => reset(setResult)(e.target.value)} aria-label="Result">
            <option value="">Any result</option>
            <option value="true">Succeeded</option>
            <option value="false">Failed or blocked</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-muted">
            From
            <input type="date" className={cn(selectClass, "flex-1")} value={from} max={to || undefined} onChange={(e) => reset(setFrom)(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            To
            <input type="date" className={cn(selectClass, "flex-1")} value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} />
          </label>
        </div>
      </Card>

      {error && <div className="mb-4 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">{error}</div>}

      {!error && !loading && rows.length === 0 ? (
        <EmptyState icon={ScrollText} title="Nothing recorded" description="No activity matches these filters yet." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">When</th>
                  <th className="px-4 py-3 font-semibold">Who</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">On</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="w-8 px-2 py-3" />
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-border", loading && "opacity-60")}>
                {loading && rows.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 w-full rounded" /></td>
                      </tr>
                    ))
                  : rows.map((r) => {
                      const expanded = open === r.id;
                      const changeEntries = Object.entries(r.changes ?? {});
                      const detailEntries = Object.entries(r.details ?? {});
                      return (
                        <Fragment key={r.id}>
                          <tr className="cursor-pointer align-top transition hover:bg-surface-2" onClick={() => setOpen(expanded ? null : r.id)}>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(r.at)}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{r.actor.name || r.actor.email || "Unknown"}</p>
                              <p className="text-xs text-muted">{r.actor.email}{r.actor.role ? ` · ${r.actor.role}` : ""}</p>
                            </td>
                            <td className="px-4 py-3 font-medium text-fg-2">{labelFor(r.action)}</td>
                            <td className="px-4 py-3 text-fg-2">
                              {r.resourceLabel || r.resourceId || "—"}
                              {r.resource && <span className="ml-1.5 text-xs text-muted">{r.resource}</span>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-fg-2">{r.country ? `${flagEmoji(r.country)} ${r.country}` : "—"}</td>
                            <td className="px-4 py-3">
                              <Badge tone={toneFor(r)}>
                                {r.action === "access.denied" ? <ShieldAlert className="h-3 w-3" /> : r.success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {r.action === "access.denied" ? "Blocked" : r.success ? "OK" : "Failed"}
                              </Badge>
                            </td>
                            <td className="px-2 py-3 text-muted"><ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} /></td>
                          </tr>
                          {expanded && (
                            <tr className="bg-surface-2">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="grid gap-4 text-xs md:grid-cols-2">
                                  <div className="space-y-1.5">
                                    {r.message && <p className="text-fg-2"><b>Note:</b> {r.message}</p>}
                                    {changeEntries.length > 0 && (
                                      <div>
                                        <p className="mb-1 font-semibold text-foreground">What changed</p>
                                        <ul className="space-y-1">
                                          {changeEntries.map(([field, c]) => (
                                            <li key={field} className="text-fg-2">
                                              <span className="font-medium">{field}</span>: <span className="text-muted line-through">{show(c.from)}</span> → <span className="text-foreground">{show(c.to)}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {detailEntries.length > 0 && (
                                      <div>
                                        <p className="mb-1 font-semibold text-foreground">Details</p>
                                        <ul className="space-y-1">
                                          {detailEntries.map(([k, v]) => (
                                            <li key={k} className="text-fg-2"><span className="font-medium">{k}</span>: {show(v)}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {!r.message && changeEntries.length === 0 && detailEntries.length === 0 && <p className="text-muted">No extra details.</p>}
                                  </div>
                                  <dl className="space-y-1 text-muted">
                                    <div><dt className="inline font-semibold">Request: </dt><dd className="inline">{r.method} {r.path} → {r.status}</dd></div>
                                    {r.resourceId && <div><dt className="inline font-semibold">Record id: </dt><dd className="inline">{r.resourceId}</dd></div>}
                                    {r.ip && <div><dt className="inline font-semibold">IP: </dt><dd className="inline">{r.ip}</dd></div>}
                                    {r.userAgent && <div className="break-all"><dt className="inline font-semibold">Device: </dt><dd className="inline">{r.userAgent}</dd></div>}
                                    <div><dt className="inline font-semibold">Account type: </dt><dd className="inline">{r.actor.source}</dd></div>
                                  </dl>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {data && data.total > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
              <span>{data.total.toLocaleString()} entr{data.total === 1 ? "y" : "ies"}</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="rounded-lg p-1.5 hover:bg-surface-3 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>Page {data.page} of {Math.max(1, data.pages)}</span>
                <button type="button" disabled={page >= data.pages || loading} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="rounded-lg p-1.5 hover:bg-surface-3 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
