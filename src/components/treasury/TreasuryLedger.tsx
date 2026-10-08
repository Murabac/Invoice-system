"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Printer, Trash2, Wallet } from "lucide-react";
import { TreasuryReport } from "@/components/treasury/TreasuryReport";
import type { TreasuryReportSummary } from "@/components/treasury/TreasuryReport";
import {
  createEntry,
  deleteEntry,
  updateEntry,
  type CashbookEntryInput,
} from "@/lib/actions/cashbook";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getCompanyDisplayName } from "@/lib/constants/company";
import { formatCurrency } from "@/lib/utils/format";
import { printDatePrefix, printWithDocumentTitle } from "@/lib/utils/print";
import type { CashbookEntryView } from "@/lib/actions/cashbook";
import type { Profile } from "@/lib/types/database";

interface TreasuryLedgerProps {
  profile: Profile | null;
  entries: CashbookEntryView[];
  summary: TreasuryReportSummary;
}

type FormMode = "income" | "expense" | null;

const emptyForm = (): CashbookEntryInput => ({
  entry_type: "income",
  amount: 0,
  entry_date: new Date().toISOString().split("T")[0],
  description: "",
  category: "",
});

export function TreasuryLedger({
  profile,
  entries,
  summary,
}: TreasuryLedgerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CashbookEntryInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openCreate(type: "income" | "expense") {
    setEditingId(null);
    setForm({ ...emptyForm(), entry_type: type });
    setFormMode(type);
    setError(null);
  }

  function openEdit(entry: CashbookEntryView) {
    setEditingId(entry.id);
    setForm({
      entry_type: entry.entry_type,
      amount: Number(entry.amount),
      entry_date: entry.entry_date,
      description: entry.display_description,
      category: entry.category ?? "",
    });
    setFormMode(entry.entry_type);
    setError(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingId(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editingId
        ? await updateEntry(editingId, form)
        : await createEntry(form);

      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      const result = await deleteEntry(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const handlePrint = () => {
    const company = getCompanyDisplayName(profile);
    const date = printDatePrefix();
    printWithDocumentTitle(`${date} ${company} Treasury Report`);
  };

  return (
    <div className="space-y-6">
      <div className="no-print grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-gray-500">Current balance</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatCurrency(summary.balance)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-gray-500">Income (MTD)</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(summary.incomeMtd)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-gray-500">Expenses (MTD)</p>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {formatCurrency(summary.expenseMtd)}
          </p>
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-3">
        <Button type="button" onClick={() => openCreate("income")}>
          <Plus className="h-4 w-4" />
          Add income
        </Button>
        <Button type="button" variant="outline" onClick={() => openCreate("expense")}>
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
        <Button type="button" variant="secondary" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print report
        </Button>
      </div>

      {formMode && (
        <form
          onSubmit={handleSubmit}
          className="no-print rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Wallet className="h-5 w-5 text-primary" />
            {editingId ? "Edit entry" : formMode === "income" ? "New income" : "New expense"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date
              </label>
              <Input
                type="date"
                required
                value={form.entry_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, entry_date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount (USD)
              </label>
              <Input
                type="number"
                required
                min={0.01}
                step={0.01}
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <Input
                required
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category (optional)
              </label>
              <Input
                value={form.category ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="Office, Travel, Sales…"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
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

      {error && !formMode && (
        <p className="no-print text-sm text-red-600">{error}</p>
      )}

      <div className="no-print overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Category
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No entries yet. Add income or expenses, or mark invoices as
                    paid to record sales automatically.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {entry.entry_date}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">
                      {entry.entry_type}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {entry.invoice_id ? (
                        <Link
                          href={`/documents/${entry.invoice_id}`}
                          className="text-primary hover:underline"
                        >
                          {entry.display_description}
                        </Link>
                      ) : (
                        entry.display_description
                      )}
                      {entry.invoice_document_number && (
                        <span className="mt-0.5 block text-xs text-gray-400">
                          {entry.invoice_document_number}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.category || "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                        entry.entry_type === "income"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {entry.entry_type === "income" ? "+" : "−"}
                      {formatCurrency(Number(entry.amount))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                          aria-label="Edit"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                          disabled={isPending}
                          onClick={() => handleDelete(entry.id)}
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

      <div className="space-y-3 pt-2">
        <div className="no-print text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Report preview — use Print report for PDF or paper
          </p>
        </div>
        <TreasuryReport
          profile={profile}
          entries={entries}
          summary={summary}
        />
      </div>
    </div>
  );
}
