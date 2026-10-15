import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guard";
import { SettingsView } from "@/components/settings/SettingsView";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SettingsView email={session.email} />;
}
