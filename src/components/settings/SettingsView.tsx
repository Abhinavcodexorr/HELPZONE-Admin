import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { AppearanceCard } from "./AppearanceCard";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { SignOutEverywhereCard } from "./SignOutEverywhereCard";

export function SettingsView({ email }: { email: string }) {
  return (
    <div>
      <PageHeader icon={Settings} title="Settings" description="Your account, security and preferences" />

      {/* A single grid (not two independently-stacked columns) so each row's
          two cards share a height — grid's default `stretch` equalizes them. */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <AppearanceCard email={email} />
        <ChangePasswordForm />
        <div className="lg:col-span-2">
          <SignOutEverywhereCard />
        </div>
      </div>
    </div>
  );
}
