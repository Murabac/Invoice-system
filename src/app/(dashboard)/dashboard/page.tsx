import Link from "next/link";
import {
  CalendarClock,
  DollarSign,
  FileClock,
  FileCheck,
  Receipt,
  Wallet,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { getCashbookSummary } from "@/lib/actions/cashbook";
import { getDashboardMetrics } from "@/lib/actions/documents";
import {
  getSubscriptionSummary,
  listExpiringSubscriptions,
} from "@/lib/actions/subscriptions";
import {
  SUBSCRIPTION_KIND_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/constants/subscriptions";
import { formatCurrency } from "@/lib/utils/format";
import {
  formatDaysRemaining,
  statusBadgeClass,
} from "@/lib/utils/subscriptions";
import { cn } from "@/lib/utils/cn";

export default async function DashboardPage() {
  const [metrics, cashbook, subSummary, expiring] = await Promise.all([
    getDashboardMetrics(),
    getCashbookSummary(),
    getSubscriptionSummary(),
    listExpiringSubscriptions(5),
  ]);

  const cards = [
    {
      label: "Cash Balance",
      value: formatCurrency(cashbook.balance),
      icon: Wallet,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Total Invoiced",
      value: formatCurrency(metrics.totalInvoiced),
      icon: DollarSign,
      color: "text-primary bg-primary/10",
    },
    {
      label: "Pending Quotations",
      value: String(metrics.pendingQuotations),
      icon: FileClock,
      color: "text-yellow-700 bg-accent-gold/20",
    },
    {
      label: "Issued Invoices",
      value: String(metrics.issuedInvoices),
      icon: Receipt,
      color: "text-accent-maroon bg-accent-maroon/10",
    },
    {
      label: "Paid Invoices",
      value: String(metrics.paidInvoices),
      icon: FileCheck,
      color: "text-green-700 bg-green-100",
    },
    {
      label: "Expiring (30d)",
      value: String(subSummary.soon),
      icon: CalendarClock,
      color: "text-amber-800 bg-amber-100",
    },
  ];

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your invoices and quotations"
        actions={
          <Link href="/documents/new">
            <Button>New Document</Button>
          </Link>
        }
      />
      <div className="page-content">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-surface p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-surface p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Subscriptions expiring soon
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Domains and renewals due within 30 days (or already expired)
              </p>
            </div>
            <Link href="/subscriptions">
              <Button variant="outline">View all</Button>
            </Link>
          </div>
          {expiring.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Nothing expiring in the next 30 days.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {expiring.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500">
                      {SUBSCRIPTION_KIND_LABELS[row.kind]} · expires{" "}
                      {row.expiry_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {formatDaysRemaining(row.days_remaining)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                        statusBadgeClass(row.status)
                      )}
                    >
                      {SUBSCRIPTION_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-gray-500">
            Get started with common tasks
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/documents/new?type=quotation">
              <Button variant="outline">Create Quotation</Button>
            </Link>
            <Link href="/documents/new?type=invoice">
              <Button variant="outline">Create Invoice</Button>
            </Link>
            <Link href="/documents">
              <Button variant="ghost">View All Documents</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
