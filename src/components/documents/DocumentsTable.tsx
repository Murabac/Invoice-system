"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightLeft,
  Eye,
  FileText,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { deleteDocument, convertToInvoice, updateDocumentStatus } from "@/lib/actions/documents";
import type { DocumentStatus, DocumentType } from "@/lib/types/database";
import { useState, useTransition } from "react";

type DocumentRow = {
  id: string;
  type: DocumentType;
  document_number: string;
  status: DocumentStatus;
  issue_date: string | null;
  due_date: string | null;
  grand_total: number;
  clients: { name: string } | null;
};

interface DocumentsTableProps {
  documents: DocumentRow[];
}

const statusOptions: { value: DocumentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
];

const statusSelectClasses: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-primary/10 text-primary",
  paid: "bg-green-100 text-green-700",
};

const typeColors: Record<DocumentType, string> = {
  quotation: "bg-accent-gold/20 text-yellow-800",
  invoice: "bg-accent-maroon/10 text-accent-maroon",
};

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const typeFilter = searchParams.get("type") ?? "all";
  const statusFilter = searchParams.get("status") ?? "all";

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/documents?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteDocument(id);
      router.refresh();
    });
  };

  const handleConvert = (id: string) => {
    startTransition(async () => {
      await convertToInvoice(id);
    });
  };

  const handleStatusChange = (id: string, status: DocumentStatus) => {
    setUpdatingStatusId(id);
    startTransition(async () => {
      const result = await updateDocumentStatus(id, status);
      setUpdatingStatusId(null);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select
          label="Type"
          value={typeFilter}
          onChange={(e) => setFilter("type", e.target.value)}
          options={[
            { value: "all", label: "All Types" },
            { value: "quotation", label: "Quotations" },
            { value: "invoice", label: "Invoices" },
          ]}
          className="w-full sm:w-44"
        />
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setFilter("status", e.target.value)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "draft", label: "Draft" },
            { value: "issued", label: "Issued" },
            { value: "paid", label: "Paid" },
          ]}
          className="w-full sm:w-44"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-surface shadow-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-surface-muted/50 text-left">
              <th className="px-6 py-3 font-semibold text-gray-700">Number</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Client</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Issue Date</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700">
                Total
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  No documents found.{" "}
                  <Link href="/documents/new" className="text-primary hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {doc.document_number}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${typeColors[doc.type]}`}
                    >
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {doc.clients?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={doc.status}
                      onChange={(e) =>
                        handleStatusChange(
                          doc.id,
                          e.target.value as DocumentStatus
                        )
                      }
                      disabled={isPending && updatingStatusId === doc.id}
                      aria-label={`Status for ${doc.document_number}`}
                      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-wait disabled:opacity-60 ${statusSelectClasses[doc.status]}`}
                    >
                      {statusOptions.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(doc.issue_date)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(Number(doc.grand_total))}
                  </td>
                  <td className="relative px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(openMenu === doc.id ? null : doc.id)
                        }
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                    {openMenu === doc.id && (
                      <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-panel">
                        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Set status
                        </p>
                        {statusOptions.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            disabled={isPending || doc.status === value}
                            onClick={() => {
                              setOpenMenu(null);
                              handleStatusChange(doc.id, value);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-50"
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${value === "draft" ? "bg-gray-400" : value === "issued" ? "bg-primary" : "bg-green-600"}`}
                            />
                            {label}
                            {doc.status === value && (
                              <span className="ml-auto text-xs text-gray-400">
                                Current
                              </span>
                            )}
                          </button>
                        ))}
                        <div className="my-1 border-t border-gray-100" />
                        {doc.type === "quotation" && (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setOpenMenu(null);
                              handleConvert(doc.id);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            Convert to Invoice
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            setOpenMenu(null);
                            handleDelete(doc.id);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
