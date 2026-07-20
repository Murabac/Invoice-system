export const COMPANY_INFO = {
  name: "Biloop Technology Innovation",
  addressLine1: "Hargaisa. Somaliland",
  addressLine2: "Ibrahim Koodbur, Badacas",
  phone: "(252) 63-4412241",
  contactName: "Mohamed",
  contactPhone: "4412241",
  contactPhone2: "",
};

export interface InvoiceContact {
  contactName: string;
  contactPhone1: string;
  contactPhone2: string;
}

export function getInvoiceContact(
  profile?:
    | {
        contact_name?: string | null;
        contact_phone_1?: string | null;
        contact_phone_2?: string | null;
      }
    | null
): InvoiceContact {
  return {
    contactName:
      profile?.contact_name?.trim() || COMPANY_INFO.contactName,
    contactPhone1:
      profile?.contact_phone_1?.trim() || COMPANY_INFO.contactPhone,
    contactPhone2:
      profile?.contact_phone_2?.trim() || COMPANY_INFO.contactPhone2,
  };
}

export function formatContactPhones(contact: InvoiceContact): string {
  const phones = [contact.contactPhone1, contact.contactPhone2].filter(Boolean);
  return phones.join(" / ");
}

export const DEFAULT_COMPANY_NAME = "Biloop Technology Innovators";

export function getCompanyDisplayName(
  profile?:
    | {
        dashboard_header_text?: string | null;
        company_name?: string | null;
      }
    | null
): string {
  return (
    profile?.dashboard_header_text?.trim() ||
    profile?.company_name?.trim() ||
    DEFAULT_COMPANY_NAME
  );
}

export const DEFAULT_TERMS = [
  "Customer will be billed 30% after indicating acceptance of this quote.",
  "Payment will be due prior to delivery of service and goods.",
  "The initial phase of the Project is scheduled to conclude within a duration of 21 days.",
];
