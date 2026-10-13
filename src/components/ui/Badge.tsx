import { cn } from "@/lib/utils";

type BadgeTone = "green" | "amber" | "red" | "gray" | "indigo" | "blue";

const toneClasses: Record<BadgeTone, string> = {
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
  gray: "bg-neutral-soft text-neutral",
  indigo: "bg-accent-soft text-accent",
  blue: "bg-info-soft text-info",
};

export function Badge({
  children,
  tone = "gray",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10",
        toneClasses[tone],
        className
      )}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
