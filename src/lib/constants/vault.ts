export const VAULT_CATEGORIES = [
  "password",
  "server",
  "company_id",
  "address",
  "other",
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
  password: "Password / login",
  server: "Server / hosting",
  company_id: "Company ID (DUNS, tax, etc.)",
  address: "Registered address",
  other: "Other",
};
