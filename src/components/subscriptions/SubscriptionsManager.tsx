"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
  type SubscriptionInput,
  type SubscriptionSummary,
  type SubscriptionWithMeta,
} from "@/lib/actions/subscriptions";
import {
  BILLING_CYCLES,
  BILLING_CYCLE_LABELS,
  SUBSCRIPTION_KINDS,
  SUBSCRIPTION_KIND_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionKind,
  type SubscriptionStatus,
} from "@/lib/constants/subscriptions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/format";
import {
  formatDaysRemaining,
  statusBadgeClass,
} from "@/lib/utils/subscriptions";
import { cn } from "@/lib/utils/cn";

interface SubscriptionsManagerProps {
  subscriptions: SubscriptionWithMeta[];
  summary: SubscriptionSummary;
}

const emptyForm = (): SubscriptionInput => ({
  name: "",
  kind: "domain",
  vendor: "",
  expiry_date: new Date().toISOString().split("T")[0],
  billing_cycle: "yearly",
  renewal_amount: null,
  currency: "USD",
  auto_renew: false,
  website_url: "",
  notes: "",
});

export function SubscriptionsManager({
  subscriptions,
  summary,
}: SubscriptionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubscriptionInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<SubscriptionKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    SubscriptionStatus | "all" | "soon"
  >("all");

  const filtered = useMemo(() => {
    return subscriptions.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (statusFilter === "all") return true;
      if (statusFilter === "soon") {
        return (
          row.status === "expired" ||
          row.status === "critical" ||
          row.status === "soon"
        );
      }
      return row.status === statusFilter;
    });
  }, [subscriptions, kindFilter, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setError(null);
  }

  function openEdit(row: SubscriptionWithMeta) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      kind: row.kind,
      vendor: row.vendor ?? "",
      expiry_date: row.expiry_date,
      billing_cycle: row.billing_cycle ?? "",
      renewal_amount:
        row.renewal_amount != null ? Number(row.renewal_amount) : null,
      currency: row.currency,
      auto_renew: row.auto_renew,
      website_url: row.website_url ?? "",
      notes: row.notes ?? "",
    });
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editingId
        ? await updateSubscription(editingId, form)
        : await createSubscription(form);

      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    startTransition(async () => {
      const result = await deleteSubscription(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total" value={String(summary.total)} />
        <SummaryCard
          label="Expired"
          value={String(summary.expired)}
          valueClass="text-red-700"
        />
        <SummaryCard
          label="Due in 7 days"
          value={String(summary.critical)}
          valueClass="text-orange-700"
        />
        <SummaryCard
          label="Due in 30 days"
          value={String(summary.soon)}
          valueClass="text-amber-700"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Type"
          value={kindFilter}
          onChange={(v) => setKindFilter(v as SubscriptionKind | "all")}
          options={[
            { value: "all", label: "All types" },
            ...SUBSCRIPTION_KINDS.map((k) => ({
              value: k,
              label: SUBSCRIPTION_KIND_LABELS[k],
            })),
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(v) =>
            setStatusFilter(v as SubscriptionStatus | "all" | "soon")
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "soon", label: "Expiring (30d)" },
            { value: "expired", label: "Expired" },
            { value: "critical", label: "Critical (7d)" },
            { value: "ok", label: "Active" },
          ]}
        />
        <Button type="button" onClick={openCreate} className="ml-auto">
          <Plus className="h-4 w-4" />
          Add subscription
        </Button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? "Edit subscription" : "New subscription"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            For passwords and DUNS numbers, use Secure vault in the sidebar.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="m2btek.com or Microsoft 365"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.kind}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    kind: e.target.value as SubscriptionKind,
                  }))
                }
              >
                {SUBSCRIPTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {SUBSCRIPTION_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Vendor (optional)
              </label>
              <Input
                value={form.vendor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor: e.target.value }))
                }
                placeholder="GoDaddy, AWS…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Expiry date
              </label>
              <Input
                type="date"
                required
                value={form.expiry_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiry_date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Billing cycle
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.billing_cycle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, billing_cycle: e.target.value }))
                }
              >
                <option value="">—</option>
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {BILLING_CYCLE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Renewal amount (optional)
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.renewal_amount ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    renewal_amount: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Currency
              </label>
              <Input
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="auto_renew"
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) =>
                  setForm((f) => ({ ...f, auto_renew: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="auto_renew" className="text-sm text-gray-700">
                Auto-renew enabled
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Portal URL (optional)
              </label>
              <Input
                type="url"
                value={form.website_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website_url: e.target.value }))
                }
                placeholder="https://"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Account email, renewal contact…"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {error && !formOpen && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Expires
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Remaining
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Renewal
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No subscriptions match your filters. Add domains, SaaS, and
                    other renewals to track expiry dates.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900">
                          {row.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusBadgeClass(row.status)
                            )}
                          >
                            {SUBSCRIPTION_STATUS_LABELS[row.status]}
                          </span>
                          {row.auto_renew && (
                            <span className="text-xs text-gray-500">
                              Auto-renew
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {SUBSCRIPTION_KIND_LABELS[row.kind]}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.vendor || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.expiry_date}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDaysRemaining(row.days_remaining)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.renewal_amount != null
                        ? formatCurrency(Number(row.renewal_amount))
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {row.website_url && (
                          <a
                            href={row.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                            title="Open portal"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          disabled={isPending}
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold text-gray-900", valueClass)}>
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </label>
      <select
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
