import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getAuthUser } from "@/lib/supabase/get-user";
import { getProfile } from "@/lib/actions/profiles";
import { canAccessDashboard } from "@/lib/auth/roles";
import { getCompanyDisplayName } from "@/lib/constants/company";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthUser();
  const profile = await getProfile();
  if (profile && !canAccessDashboard(profile.role)) {
    redirect("/account-pending");
  }
  const brandTheme = profile?.invoice_header_theme ?? "m2b";

  return (
    <DashboardShell
      dashboardLogoUrl={profile?.dashboard_logo_url}
      dashboardHeaderText={getCompanyDisplayName(profile)}
      brandTheme={brandTheme}
      userRole={profile?.role ?? null}
    >
      {children}
    </DashboardShell>
  );
}
