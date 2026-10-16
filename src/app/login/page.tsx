import type { Metadata } from "next";
import { Lock, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { TiltCard } from "@/components/auth/TiltCard";
import { WaterRipples } from "@/components/auth/WaterRipples";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in · Help Zone Admin" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#070d20] via-[#0f2070] to-[#2a56d6] px-5 py-10">
      {/* dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse at 50% 45%, black 15%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 15%, transparent 75%)",
        }}
      />

      <WaterRipples />

      <div data-no-ripple className="absolute right-4 top-4 z-20 [&_button]:text-white/90 [&_button:hover]:bg-white/15 [&_button:hover]:text-white">
        <ThemeToggle />
      </div>

      <div data-no-ripple className="relative z-10 w-full max-w-[26rem] animate-pop-in">
        <div className="mb-7 flex justify-center">
          <Logo surface="dark" className="h-14 w-auto" />
        </div>

        <TiltCard className="rounded-3xl border border-border bg-surface/95 p-7 shadow-[0_40px_80px_-24px_rgba(0,8,40,0.7),0_2px_0_rgba(255,255,255,0.5)_inset] backdrop-blur-sm sm:p-9">
          <div className="flex flex-col items-center text-center">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-[color-mix(in_srgb,var(--primary)_70%,white)] to-primary text-primary-foreground shadow-[inset_0_2px_0_rgba(255,255,255,0.55),inset_0_-5px_8px_rgba(0,0,0,0.2),0_10px_18px_-6px_color-mix(in_srgb,var(--primary)_65%,transparent)]">
              <Lock className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-[1.7rem] font-semibold tracking-tight text-foreground">Welcome back</h1>
          </div>

          <div className="mt-7">
            <LoginForm next={safeNextPath(next) ?? "/dashboard"} />
          </div>
        </TiltCard>

        <p className="mt-6 text-center text-xs text-blue-100/80">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
          Secured session · Access limited to authorised administrators
        </p>
      </div>
    </main>
  );
}
