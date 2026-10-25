"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/actions/profiles";
import {
  SUBSCRIPTION_KINDS,
  type SubscriptionKind,
  type SubscriptionStatus,
  BILLING_CYCLES,
  type BillingCycle,
} from "@/lib/constants/subscriptions";
import { computeSubscriptionStatus } from "@/lib/utils/subscriptions";
import { canAccessDashboard } from "@/lib/auth/roles";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type { Subscription } from "@/lib/types/database";

export type SubscriptionInput = {
  name: string;
  kind: SubscriptionKind;
  vendor: string;
  expiry_date: string;
  billing_cycle: string;
  renewal_amount: number | null;
  currency: string;
  auto_renew: boolean;
  website_url: string;
  notes: string;
};

export type SubscriptionWithMeta = Subscription & {
  status: SubscriptionStatus;
  days_remaining: number;
};

export type SubscriptionSummary = {
  total: number;
  expired: number;
  critical: number;
  soon: number;
};

function revalidateSubscriptions() {
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function requireSubscriptionAccess() {
  const user = await getAuthUser();
  const profile = await getProfile();
  if (!user || !profile || !canAccessDashboard(profile.role)) {
    return { error: "Unauthorized" as const, user: null, profile: null };
  }
  return { error: null, user, profile };
}

function enrich(row: Subscription): SubscriptionWithMeta {
  const { status, days_remaining } = computeSubscriptionStatus(row.expiry_date);
  return { ...row, status, days_remaining };
}

type NormalizedSubscription = {
  name: string;
  kind: SubscriptionKind;
  vendor: string;
  expiry_date: string;
  billing_cycle: BillingCycle | null;
  renewal_amount: number | null;
  currency: string;
  auto_renew: boolean;
  website_url: string;
  notes: string;
};

function normalizeInput(input: SubscriptionInput): {
  data: NormalizedSubscription;
  error?: string;
} {
  const name = input.name.trim();
  if (!name) {
    return {
      data: { ...input, name, billing_cycle: null, renewal_amount: null },
      error: "Name is required",
    };
  }

  if (!SUBSCRIPTION_KINDS.includes(input.kind)) {
    return {
      data: { ...input, name, billing_cycle: null, renewal_amount: null },
      error: "Invalid subscription type",
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiry_date)) {
    return {
      data: { ...input, name, billing_cycle: null, renewal_amount: null },
      error: "Invalid expiry date",
    };
  }

  const billing = input.billing_cycle.trim();
  const billing_cycle: BillingCycle | null = billing
    ? (billing as BillingCycle)
    : null;
  if (billing_cycle && !BILLING_CYCLES.includes(billing_cycle)) {
    return {
      data: { ...input, name, billing_cycle: null, renewal_amount: null },
      error: "Invalid billing cycle",
    };
  }

  const renewal_amount =
    input.renewal_amount != null && !Number.isNaN(input.renewal_amount)
      ? Math.max(0, input.renewal_amount)
      : null;

  const currency = (input.currency.trim() || "USD").toUpperCase();

  return {
    data: {
      name,
      kind: input.kind,
      vendor: input.vendor.trim(),
      expiry_date: input.expiry_date,
      billing_cycle,
      renewal_amount,
      currency,
      auto_renew: input.auto_renew,
      website_url: input.website_url.trim(),
      notes: input.notes.trim(),
    },
  };
}

export type ListSubscriptionsFilters = {
  kind?: SubscriptionKind | "all";
  status?: SubscriptionStatus | "all" | "soon_or_expired";
};

export async function listSubscriptions(
  filters: ListSubscriptionsFilters = {}
): Promise<SubscriptionWithMeta[]> {
  const check = await requireSubscriptionAccess();
  if (check.error) return [];

  const supabase = await getSupabase();
  let query = supabase.from("subscriptions").select("*").order("expiry_date", {
    ascending: true,
  });

  if (filters.kind && filters.kind !== "all") {
    query = query.eq("kind", filters.kind);
  }

  const { data } = await query;
  let rows = (data ?? []).map(enrich);

  if (filters.status && filters.status !== "all") {
    if (filters.status === "soon_or_expired") {
      rows = rows.filter(
        (r) =>
          r.status === "expired" ||
          r.status === "critical" ||
          r.status === "soon"
      );
    } else {
      rows = rows.filter((r) => r.status === filters.status);
    }
  }

  return rows;
}

export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const rows = await listSubscriptions();
  return {
    total: rows.length,
    expired: rows.filter((r) => r.status === "expired").length,
    critical: rows.filter((r) => r.status === "critical").length,
    soon: rows.filter(
      (r) =>
        r.status === "expired" ||
        r.status === "critical" ||
        r.status === "soon"
    ).length,
  };
}

export async function listExpiringSubscriptions(
  limit = 5
): Promise<SubscriptionWithMeta[]> {
  const rows = await listSubscriptions({ status: "soon_or_expired" });
  return rows.slice(0, limit);
}

export async function createSubscription(input: SubscriptionInput) {
  const check = await requireSubscriptionAccess();
  if (check.error) return { error: check.error };

  const normalized = normalizeInput(input);
  if (normalized.error) return { error: normalized.error };
  const d = normalized.data;

  const supabase = await getSupabase();
  const { error } = await supabase.from("subscriptions").insert({
    name: d.name,
    kind: d.kind,
    vendor: d.vendor || null,
    expiry_date: d.expiry_date,
    billing_cycle: d.billing_cycle,
    renewal_amount: d.renewal_amount,
    currency: d.currency,
    auto_renew: d.auto_renew,
    website_url: d.website_url || null,
    notes: d.notes || null,
    created_by: check.user!.id,
  });

  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { success: true };
}

export async function updateSubscription(id: string, input: SubscriptionInput) {
  const check = await requireSubscriptionAccess();
  if (check.error) return { error: check.error };

  const normalized = normalizeInput(input);
  if (normalized.error) return { error: normalized.error };
  const d = normalized.data;

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      name: d.name,
      kind: d.kind,
      vendor: d.vendor || null,
      expiry_date: d.expiry_date,
      billing_cycle: d.billing_cycle,
      renewal_amount: d.renewal_amount,
      currency: d.currency,
      auto_renew: d.auto_renew,
      website_url: d.website_url || null,
      notes: d.notes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { success: true };
}

export async function deleteSubscription(id: string) {
  const check = await requireSubscriptionAccess();
  if (check.error) return { error: check.error };

  const supabase = await getSupabase();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidateSubscriptions();
  return { success: true };
}
