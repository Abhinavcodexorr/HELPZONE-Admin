import { InfoHint } from "@/components/ui/InfoHint";

/** Title + one-line caption on the left; a logic hint (and optional action) on the right. */
export function CardHeader({
  title,
  caption,
  hint,
  action,
}: {
  title: string;
  caption?: string;
  hint?: { title?: string; body: React.ReactNode };
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {caption && <p className="mt-0.5 text-xs text-muted">{caption}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {action}
        {hint && <InfoHint title={hint.title ?? title}>{hint.body}</InfoHint>}
      </div>
    </div>
  );
}
