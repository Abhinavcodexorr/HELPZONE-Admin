import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProvidersProvider } from "@/store/ProvidersContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProvidersProvider>
      <DashboardShell>{children}</DashboardShell>
    </ProvidersProvider>
  );
}
