import { AppShell } from "./AppShell";

import type { InvoiceHeaderTheme, UserRole } from "@/lib/types/database";

interface DashboardShellProps {
  children: React.ReactNode;
  dashboardLogoUrl?: string | null;
  dashboardHeaderText?: string | null;
  brandTheme?: InvoiceHeaderTheme;
  userRole?: UserRole | null;
}

export function DashboardShell(props: DashboardShellProps) {
  return <AppShell {...props} />;
}
