import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type Tone = "indigo" | "emerald" | "amber" | "sky" | "rose";

const toneClasses: Record<Tone, string> = {
  indigo: "bg-accent-soft text-accent",
  emerald: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  sky: "bg-info-soft text-info",
  rose: "bg-danger-soft text-danger",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
