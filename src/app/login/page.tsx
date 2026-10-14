import type { Metadata } from "next";
import { BadgeCheck, ShieldCheck, Video } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in · Help Zone Admin" };

const highlights = [
  { icon: ShieldCheck, text: "Review KYC documents and ID proofs in one place" },
  { icon: Video, text: "Watch intro videos before approving a provider" },
  { icon: BadgeCheck, text: "Approve or reject applications in a click" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative inline-flex w-fit rounded-2xl bg-white px-6 py-4 shadow-xl shadow-black/20">
          <Logo surface="light" className="h-11 w-auto" />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Verify every provider with confidence.
          </h1>
          <p className="mt-4 text-base text-blue-100">
            The Help Zone admin panel for reviewing applications, documents and videos.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-blue-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-200">© Help Zone. Authorised administrators only.</p>
      </section>

      <section className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md animate-pop-in">
          <div className="mb-8 lg:hidden">
            <Logo className="h-12 w-auto" />
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-2 text-sm text-muted">Sign in to continue to the admin panel.</p>

          <div className="mt-8">
            <LoginForm next={safeNextPath(next) ?? "/dashboard"} />
          </div>

          <p className="mt-8 text-center text-xs text-subtle">
            Access is limited to authorised administrators.
          </p>
        </div>
      </section>
    </main>
  );
}
