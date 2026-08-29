import { COMPANY_INFO, DEFAULT_TERMS } from "@/lib/constants/company";
import type { LogoPreset } from "@/lib/constants/logos";
import type { InvoiceHeaderTheme, InvoiceStampPreset } from "@/lib/types/database";

export type CompanyPresetId = "biloop" | "h24" | "m2b";

export interface CompanyPreset {
  id: CompanyPresetId;
  label: string;
  description: string;
  logoUrl: string;
  previewClass?: string;
  headerText: string;
  addressLine1: string;
  addressLine2: string;
  businessPhone: string;
  contactName: string;
  contactPhone1: string;
  contactPhone2: string;
  invoiceHeaderTheme: InvoiceHeaderTheme;
  logoPreset: LogoPreset;
  stampPreset: InvoiceStampPreset;
  defaultTerms: string[];
}

export const COMPANY_PRESETS: Record<CompanyPresetId, CompanyPreset> = {
  biloop: {
    id: "biloop",
    label: "Biloop",
    description: "Biloop Technology Innovators — blue brand theme.",
    logoUrl: "/logo.jpeg",
    headerText: "Biloop Technology Innovators",
    addressLine1: COMPANY_INFO.addressLine1,
    addressLine2: COMPANY_INFO.addressLine2,
    businessPhone: COMPANY_INFO.phone,
    contactName: COMPANY_INFO.contactName,
    contactPhone1: COMPANY_INFO.contactPhone,
    contactPhone2: COMPANY_INFO.contactPhone2,
    invoiceHeaderTheme: "blue",
    logoPreset: "biloop",
    stampPreset: "biloop",
    defaultTerms: DEFAULT_TERMS,
  },
  h24: {
    id: "h24",
    label: "H24 Technology",
    description: "H24 Technology — sky-blue brand theme.",
    logoUrl: "/logo-h24.png",
    previewClass: "bg-black",
    headerText: "H24 Technology",
    addressLine1: COMPANY_INFO.addressLine1,
    addressLine2: COMPANY_INFO.addressLine2,
    businessPhone: COMPANY_INFO.phone,
    contactName: COMPANY_INFO.contactName,
    contactPhone1: COMPANY_INFO.contactPhone,
    contactPhone2: COMPANY_INFO.contactPhone2,
    invoiceHeaderTheme: "h24",
    logoPreset: "h24",
    stampPreset: "h24",
    defaultTerms: DEFAULT_TERMS,
  },
  m2b: {
    id: "m2b",
    label: "M2B Technology",
    description:
      "M2B Technology — navy and gold brand. Technology | Innovation | Solutions.",
    logoUrl: "/logo-m2b.png",
    headerText: "M2B Technology",
    addressLine1: "Hargaisa, Somaliland",
    addressLine2: "Ibrahim Koodbur, Badacas",
    businessPhone: "(252) 63-4412241",
    contactName: "Mohamed",
    contactPhone1: "4412241",
    contactPhone2: "",
    invoiceHeaderTheme: "m2b",
    logoPreset: "m2b",
    stampPreset: "m2b",
    defaultTerms: [
      "Customer will be billed 30% after indicating acceptance of this quote.",
      "Payment will be due prior to delivery of service and goods.",
      "Connecting today, building tomorrow.",
    ],
  },
};

export const COMPANY_PRESET_ORDER: CompanyPresetId[] = ["biloop", "h24", "m2b"];

export function detectCompanyPreset(profile?: {
  dashboard_header_text?: string | null;
  invoice_header_theme?: InvoiceHeaderTheme | null;
  logo_url?: string | null;
} | null): CompanyPresetId | null {
  if (!profile) return null;

  const header = profile.dashboard_header_text?.trim().toLowerCase();
  const theme = profile.invoice_header_theme;
  const logo = profile.logo_url?.split("?")[0] ?? "";

  if (logo.includes("logo-m2b") || theme === "m2b" || header?.includes("m2b")) {
    return "m2b";
  }
  if (logo.includes("logo-h24") || theme === "h24" || header?.includes("h24")) {
    return "h24";
  }
  if (
    theme === "blue" ||
    theme === "gradient" ||
    logo.includes("logo.jpeg") ||
    header?.includes("biloop")
  ) {
    return "biloop";
  }

  return null;
}
