import { COMPANY_INFO, DEFAULT_TERMS, M2B_LOGO_URL } from "@/lib/constants/company";
import type { InvoiceHeaderTheme, InvoiceStampPreset } from "@/lib/types/database";

/** Single M2B brand defaults (used for profile normalization). */
export const M2B_BRAND = {
  headerText: COMPANY_INFO.name,
  addressLine1: COMPANY_INFO.addressLine1,
  addressLine2: COMPANY_INFO.addressLine2,
  businessPhone: COMPANY_INFO.phone,
  contactName: COMPANY_INFO.contactName,
  contactPhone1: COMPANY_INFO.contactPhone,
  contactPhone2: COMPANY_INFO.contactPhone2,
  invoiceHeaderTheme: "m2b" as InvoiceHeaderTheme,
  stampPreset: "m2b" as InvoiceStampPreset,
  logoUrl: M2B_LOGO_URL,
  defaultTerms: DEFAULT_TERMS,
};
