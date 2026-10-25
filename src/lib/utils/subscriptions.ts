import {
  SUBSCRIPTION_CRITICAL_DAYS,
  SUBSCRIPTION_SOON_DAYS,
  type SubscriptionStatus,
} from "@/lib/constants/subscriptions";

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseExpiryDate(expiryDate: string): Date {
  const [y, m, day] = expiryDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function computeSubscriptionStatus(expiryDate: string): {
  status: SubscriptionStatus;
  days_remaining: number;
} {
  const today = startOfTodayUtc();
  const expiry = parseExpiryDate(expiryDate);
  const msPerDay = 86400000;
  const days_remaining = Math.round(
    (expiry.getTime() - today.getTime()) / msPerDay
  );

  if (days_remaining < 0) {
    return { status: "expired", days_remaining };
  }
  if (days_remaining <= SUBSCRIPTION_CRITICAL_DAYS) {
    return { status: "critical", days_remaining };
  }
  if (days_remaining <= SUBSCRIPTION_SOON_DAYS) {
    return { status: "soon", days_remaining };
  }
  return { status: "ok", days_remaining };
}

export function statusBadgeClass(status: SubscriptionStatus): string {
  switch (status) {
    case "expired":
      return "bg-red-100 text-red-800 border-red-200";
    case "critical":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "soon":
      return "bg-amber-100 text-amber-900 border-amber-200";
    default:
      return "bg-green-100 text-green-800 border-green-200";
  }
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    const abs = Math.abs(days);
    return abs === 1 ? "1 day ago" : `${abs} days ago`;
  }
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}
