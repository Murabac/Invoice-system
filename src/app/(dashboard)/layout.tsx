import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAuthUser } from "@/lib/supabase/get-user";
import { getProfile } from "@/lib/actions/profiles";
import type { InvoiceHeaderTheme } from "@/lib/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthUser();
  const profile = await getProfile();
  const brandTheme =
    (profile?.invoice_header_theme as InvoiceHeaderTheme | undefined) ?? "blue";

  return (
    <DashboardShell
      dashboardLogoUrl={profile?.dashboard_logo_url}
      dashboardHeaderText={profile?.dashboard_header_text}
      brandTheme={brandTheme}
      userRole={profile?.role ?? null}
    >
      {children}
    </DashboardShell>
  );
}
