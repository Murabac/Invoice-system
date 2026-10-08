import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BusinessLocationSetting } from "@/components/settings/BusinessLocationSetting";
import { InvoiceContactSetting } from "@/components/settings/InvoiceContactSetting";
import { DefaultTermsSetting } from "@/components/settings/DefaultTermsSetting";
import { DashboardHeaderSetting } from "@/components/settings/DashboardHeaderSetting";
import { LogoPresetSetting } from "@/components/settings/LogoPresetSetting";
import {
  getProfile,
  updateDashboardLogoPreset,
  updateInvoiceLogoPreset,
  uploadDashboardLogo,
  uploadInvoiceLogo,
} from "@/lib/actions/profiles";
import { canAccessSettings } from "@/lib/auth/roles";
import {
  getCompanyDisplayName,
  getBusinessLocation,
  getInvoiceContact,
} from "@/lib/constants/company";
import { getDefaultTerms } from "@/lib/utils/terms";

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile || !canAccessSettings(profile.role)) {
    redirect("/dashboard");
  }

  const dashboardHeaderText = getCompanyDisplayName(profile);
  const defaultTerms = getDefaultTerms(profile);
  const invoiceContact = getInvoiceContact(profile);
  const businessLocation = getBusinessLocation(profile);

  return (
    <>
      <Header
        title="Settings"
        description="Customize M2B branding across the app and invoices"
      />
      <div className="page-content">
        <div className="mx-auto max-w-3xl space-y-6">
          <DashboardHeaderSetting initialText={dashboardHeaderText} />

          <BusinessLocationSetting initialLocation={businessLocation} />

          <InvoiceContactSetting initialContact={invoiceContact} />

          <DefaultTermsSetting initialTerms={defaultTerms} />

          <LogoPresetSetting
            title="Dashboard Logo"
            description="Upload a custom logo for the sidebar, or use the default M2B logo."
            logoUrl={profile?.dashboard_logo_url}
            updateAction={updateDashboardLogoPreset}
            uploadAction={uploadDashboardLogo}
          />

          <LogoPresetSetting
            title="Invoice Logo"
            description="Upload a custom logo for quotations and invoices, or use the default M2B logo."
            logoUrl={profile?.logo_url}
            updateAction={updateInvoiceLogoPreset}
            uploadAction={uploadInvoiceLogo}
          />
        </div>
      </div>
    </>
  );
}
