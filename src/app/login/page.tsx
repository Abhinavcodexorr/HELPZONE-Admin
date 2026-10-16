import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { LampLogin } from "@/components/auth/LampLogin";
import { safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in · Help Zone Admin" };

// Display serif for the heading and the lamp's hint, matching the logo's lettering.
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair" });

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className={playfair.variable}>
      <LampLogin next={safeNextPath(next) ?? "/dashboard"} />
    </div>
  );
}
