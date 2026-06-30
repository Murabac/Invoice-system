import { Sidebar } from "./Sidebar";

import type { InvoiceHeaderTheme, UserRole } from "@/lib/types/database";

interface DashboardShellProps {
  children: React.ReactNode;
  dashboardLogoUrl?: string | null;
  dashboardHeaderText?: string | null;
  brandTheme?: InvoiceHeaderTheme;
  userRole?: UserRole | null;
}

export function DashboardShell({
  children,
  dashboardLogoUrl,
  dashboardHeaderText,
  brandTheme = "blue",
  userRole,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen" data-brand-theme={brandTheme}>
      <Sidebar
        dashboardLogoUrl={dashboardLogoUrl}
        dashboardHeaderText={dashboardHeaderText}
        userRole={userRole}
      />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
