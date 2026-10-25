export const SUBSCRIPTION_KINDS = [
  "domain",
  "saas",
  "hosting",
  "ssl",
  "license",
  "other",
] as const;

export type SubscriptionKind = (typeof SUBSCRIPTION_KINDS)[number];

export const SUBSCRIPTION_KIND_LABELS: Record<SubscriptionKind, string> = {
  domain: "Domain",
  saas: "SaaS",
  hosting: "Hosting",
  ssl: "SSL",
  license: "License",
  other: "Other",
};

export const BILLING_CYCLES = [
  "monthly",
  "yearly",
  "one_time",
  "other",
] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_time: "One-time",
  other: "Other",
};

export const SUBSCRIPTION_CRITICAL_DAYS = 7;
export const SUBSCRIPTION_SOON_DAYS = 30;

export type SubscriptionStatus = "expired" | "critical" | "soon" | "ok";

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  expired: "Expired",
  critical: "Due in 7 days",
  soon: "Due in 30 days",
  ok: "Active",
};
