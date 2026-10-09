import {
  Sparkles,
  ChefHat,
  Wrench,
  Zap,
  Baby,
  Car,
  Flower2,
  SprayCan,
  LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "chef-hat": ChefHat,
  wrench: Wrench,
  zap: Zap,
  baby: Baby,
  car: Car,
  flower: Flower2,
  "spray-can": SprayCan,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} />;
}
