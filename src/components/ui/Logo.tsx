import { cn } from "@/lib/utils";

// Two files because the artwork differs by surface: dark ink on light surfaces,
// white "help" (and an inverted plus) on dark ones. `surface` is the backdrop the
// logo sits on; "auto" follows the app theme.
export function Logo({ className, surface = "auto" }: { className?: string; surface?: "auto" | "light" | "dark" }) {
  if (surface !== "auto") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/logo-${surface}.png`} alt="Help Zone" className={className} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-light.png" alt="Help Zone" className={cn("dark:hidden", className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-dark.png" alt="Help Zone" className={cn("hidden dark:block", className)} />
    </>
  );
}
