import Link from "next/link";
import { DollarSign, FileClock, FileCheck, Receipt } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { getDashboardMetrics } from "@/lib/actions/documents";
import { formatCurrency } from "@/lib/utils/format";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  const cards = [
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
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
