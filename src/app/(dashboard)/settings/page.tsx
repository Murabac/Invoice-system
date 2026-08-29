import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CompanyPresetSetting } from "@/components/settings/CompanyPresetSetting";
import { BusinessLocationSetting } from "@/components/settings/BusinessLocationSetting";
import { InvoiceContactSetting } from "@/components/settings/InvoiceContactSetting";
import { DefaultTermsSetting } from "@/components/settings/DefaultTermsSetting";
import { DashboardHeaderSetting } from "@/components/settings/DashboardHeaderSetting";
import { InvoiceHeaderThemeSetting } from "@/components/settings/InvoiceHeaderThemeSetting";
import { LogoPresetSetting } from "@/components/settings/LogoPresetSetting";
import { StampPresetSetting } from "@/components/settings/StampPresetSetting";
import {
  getProfile,
  updateDashboardLogoPreset,
  updateInvoiceLogoPreset,
  uploadDashboardLogo,
  uploadInvoiceLogo,
} from "@/lib/actions/profiles";
import { canAccessSettings } from "@/lib/auth/roles";
import { getCompanyDisplayName, getBusinessLocation, getInvoiceContact } from "@/lib/constants/company";
import { detectCompanyPreset } from "@/lib/constants/companies";
import { getDefaultTerms } from "@/lib/utils/terms";
import type { InvoiceHeaderTheme, InvoiceStampPreset } from "@/lib/types/database";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile || !canAccessSettings(profile.role)) {
    redirect("/dashboard");
  }

  const dashboardHeaderText = getCompanyDisplayName(profile);
  const invoiceHeaderTheme =
    (profile?.invoice_header_theme as InvoiceHeaderTheme | undefined) ?? "blue";
  const invoiceStamp =
    (profile?.invoice_stamp as InvoiceStampPreset | undefined) ?? "biloop";
  const defaultTerms = getDefaultTerms(profile);
  const invoiceContact = getInvoiceContact(profile);
  const businessLocation = getBusinessLocation(profile);
  const activeCompanyPreset = detectCompanyPreset(profile);

  return (
    <>
      <Header
        title="Settings"
        description="Customize your branding across the app and invoices"
      />
      <div className="page-content">
        <div className="mx-auto max-w-3xl space-y-6">
          <CompanyPresetSetting activePreset={activeCompanyPreset} />

          <DashboardHeaderSetting initialText={dashboardHeaderText} />

          <BusinessLocationSetting initialLocation={businessLocation} />

          <InvoiceContactSetting initialContact={invoiceContact} />

          <DefaultTermsSetting initialTerms={defaultTerms} />

          <InvoiceHeaderThemeSetting initialTheme={invoiceHeaderTheme} />

          <StampPresetSetting initialPreset={invoiceStamp} />

          <LogoPresetSetting
            title="Dashboard Logo"
            description="Choose a preset or upload a custom logo for the sidebar."
            logoUrl={profile?.dashboard_logo_url}
            updateAction={updateDashboardLogoPreset}
            uploadAction={uploadDashboardLogo}
          />

          <LogoPresetSetting
            title="Invoice Logo"
            description="Choose a preset or upload a custom logo for quotations and invoices."
            logoUrl={profile?.logo_url}
            updateAction={updateInvoiceLogoPreset}
            uploadAction={uploadInvoiceLogo}
          />
        </div>
      </div>
    </>
  );
}
