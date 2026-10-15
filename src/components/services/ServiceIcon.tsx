import {
  Baby,
  Car,
  ChefHat,
  Droplets,
  Flower2,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  PaintRoller,
  PawPrint,
  ShieldCheck,
  Shirt,
  Sparkles,
  SprayCan,
  Stethoscope,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Keys must match the backend's SERVICE_ICONS list (config/constants.js).
const icons: Record<string, { icon: LucideIcon; label: string }> = {
  sparkles: { icon: Sparkles, label: "Sparkles" },
  "chef-hat": { icon: ChefHat, label: "Cooking" },
  wrench: { icon: Wrench, label: "Repairs" },
  zap: { icon: Zap, label: "Electrical" },
  baby: { icon: Baby, label: "Child care" },
  car: { icon: Car, label: "Driver" },
  flower: { icon: Flower2, label: "Gardening" },
  "spray-can": { icon: SprayCan, label: "Cleaning" },
  droplets: { icon: Droplets, label: "Plumbing" },
  "paint-roller": { icon: PaintRoller, label: "Painting" },
  hammer: { icon: Hammer, label: "Carpentry" },
  "heart-pulse": { icon: HeartPulse, label: "Elderly care" },
  "paw-print": { icon: PawPrint, label: "Pet care" },
  shirt: { icon: Shirt, label: "Laundry" },
  home: { icon: Home, label: "Home help" },
  "graduation-cap": { icon: GraduationCap, label: "Tutor" },
  stethoscope: { icon: Stethoscope, label: "Nursing" },
  "shield-check": { icon: ShieldCheck, label: "Security" },
};

export const serviceIconOptions = Object.entries(icons).map(([value, { label }]) => ({ value, label }));

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons[name] ?? icons.sparkles).icon;
  return <Icon className={className} />;
}
