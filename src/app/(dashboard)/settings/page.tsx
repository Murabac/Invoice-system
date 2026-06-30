import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DashboardHeaderSetting } from "@/components/settings/DashboardHeaderSetting";
import { InvoiceHeaderThemeSetting } from "@/components/settings/InvoiceHeaderThemeSetting";
import { LogoPresetSetting } from "@/components/settings/LogoPresetSetting";
import {
  getProfile,
  updateDashboardLogoPreset,
  updateInvoiceLogoPreset,
} from "@/lib/actions/profiles";
import { canAccessSettings } from "@/lib/auth/roles";
import type { InvoiceHeaderTheme } from "@/lib/types/database";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile || !canAccessSettings(profile.role)) {
    redirect("/dashboard");
  }

  const dashboardHeaderText =
    profile?.dashboard_header_text ?? "Biloop Technology Innovators";
  const invoiceHeaderTheme =
    (profile?.invoice_header_theme as InvoiceHeaderTheme | undefined) ?? "blue";

  return (
    <>
      <Header
        title="Settings"
        description="Customize your branding across the app and invoices"
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <DashboardHeaderSetting initialText={dashboardHeaderText} />

          <InvoiceHeaderThemeSetting initialTheme={invoiceHeaderTheme} />

          <LogoPresetSetting
            title="Dashboard Logo"
            description="Choose which logo appears in the sidebar."
            logoUrl={profile?.dashboard_logo_url}
            updateAction={updateDashboardLogoPreset}
          />

          <LogoPresetSetting
            title="Invoice Logo"
            description="Choose which logo appears on quotations and invoices."
            logoUrl={profile?.logo_url}
            updateAction={updateInvoiceLogoPreset}
          />
        </div>
      </div>
    </>
  );
}
