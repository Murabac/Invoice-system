"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Printer,
  Save,
  Trash2,
} from "lucide-react";
import { DocumentCanvas } from "./DocumentCanvas";
import { ClientLogoUpload } from "@/components/clients/ClientLogoUpload";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  saveDocument,
  convertToInvoice,
} from "@/lib/actions/documents";
import {
  addDaysISO,
  createEmptyLineItem,
  todayISO,
} from "@/lib/utils/format";
import type {
  Client,
  DocumentFormState,
  DocumentType,
  DocumentWithRelations,
  Profile,
} from "@/lib/types/database";

interface DocumentWorkspaceProps {
  clients: Client[];
  profile: Profile | null;
  initialDocument?: DocumentWithRelations | null;
  defaultDocumentNumber: string;
  defaultType?: DocumentType;
}

function buildInitialState(
  initial: DocumentWithRelations | null | undefined,
  defaultDocumentNumber: string,
  defaultType: DocumentType
): DocumentFormState {
  if (initial) {
    return {
      type: initial.type,
      status: initial.status,
      document_number: initial.document_number,
      issue_date: initial.issue_date ?? todayISO(),
      due_date: initial.due_date ?? addDaysISO(30),
      client_id: initial.client_id ?? "",
      tax_rate: Number(initial.tax_rate),
      has_stamp: initial.has_stamp,
      notes: initial.notes ?? "",
      items:
        initial.document_items.length > 0
          ? initial.document_items.map((item) => ({
              id: item.id,
              product_name: item.product_name,
              unit_price: Number(item.unit_price),
              quantity: Number(item.quantity),
            }))
          : [createEmptyLineItem()],
    };
  }

  return {
    type: defaultType,
    status: "draft",
    document_number: defaultDocumentNumber,
    issue_date: todayISO(),
    due_date: addDaysISO(30),
    client_id: "",
    tax_rate: 0,
    has_stamp: false,
    notes: "",
    items: [createEmptyLineItem()],
  };
}

export function DocumentWorkspace({
  clients,
  profile,
  initialDocument,
  defaultDocumentNumber,
  defaultType = "quotation",
}: DocumentWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<DocumentFormState>(() =>
    buildInitialState(initialDocument, defaultDocumentNumber, defaultType)
  );
  const [clientLogoUrls, setClientLogoUrls] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        clients
          .filter((c) => c.logo_url)
          .map((c) => [c.id, c.logo_url as string])
      )
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState(
    profile?.logo_url ?? "/logo.jpeg"
  );

  useEffect(() => {
    setCompanyLogoUrl(profile?.logo_url ?? "/logo.jpeg");
  }, [profile?.logo_url]);

  const previewProfile = useMemo(
    () =>
      profile
        ? { ...profile, logo_url: companyLogoUrl }
        : ({ logo_url: companyLogoUrl } as Profile),
    [profile, companyLogoUrl]
  );

  const selectedClient = useMemo(() => {
    const client = clients.find((c) => c.id === form.client_id) ?? null;
    if (!client) return null;
    const logo_url = clientLogoUrls[client.id] ?? client.logo_url;
    return { ...client, logo_url };
  }, [clients, form.client_id, clientLogoUrls]);

  const updateForm = useCallback(
    <K extends keyof DocumentFormState>(key: K, value: DocumentFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateItem = useCallback(
    (id: string, field: keyof DocumentFormState["items"][0], value: string | number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      }));
    },
    []
  );

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyLineItem()],
    }));
  };

  const removeItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((item) => item.id !== id)
          : prev.items,
    }));
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    if (!form.client_id) {
      setError("Please select a client.");
      return;
    }

    startTransition(async () => {
      const result = await saveDocument(form, initialDocument?.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Document saved successfully.");
      if (result.id && !initialDocument) {
        router.push(`/documents/${result.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleConvert = () => {
    if (!initialDocument || initialDocument.type !== "quotation") return;
    startTransition(async () => {
      await convertToInvoice(initialDocument.id);
    });
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Left panel — form */}
      <div className="no-print w-full shrink-0 overflow-y-auto border-r border-gray-200 bg-surface lg:w-[420px] xl:w-[480px]">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {initialDocument ? "Edit Document" : "Create Document"}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                <Save className="h-4 w-4" />
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Document Type"
              value={form.type}
              onChange={(e) =>
                updateForm("type", e.target.value as DocumentType)
              }
              options={[
                { value: "quotation", label: "Quotation" },
                { value: "invoice", label: "Invoice" },
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                updateForm(
                  "status",
                  e.target.value as DocumentFormState["status"]
                )
              }
              options={[
                { value: "draft", label: "Draft" },
                { value: "issued", label: "Issued" },
                { value: "paid", label: "Paid" },
              ]}
            />
          </div>

          <Input
            label="Document Number"
            value={form.document_number}
            onChange={(e) => updateForm("document_number", e.target.value)}
          />

          <Select
            label="Client"
            value={form.client_id}
            onChange={(e) => updateForm("client_id", e.target.value)}
            options={[
              { value: "", label: "Select a client…" },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <p className="-mt-2 text-xs text-gray-500">
            <Link href="/clients/new" className="text-primary hover:underline">
              Add a client
            </Link>
          </p>

          {selectedClient && (
            <ClientLogoUpload
              clientId={selectedClient.id}
              clientName={selectedClient.name}
              logoUrl={selectedClient.logo_url}
              onLogoUpdated={(url) =>
                setClientLogoUrls((prev) => ({
                  ...prev,
                  [selectedClient.id]: url,
                }))
              }
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={form.issue_date}
              onChange={(e) => updateForm("issue_date", e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={(e) => updateForm("due_date", e.target.value)}
            />
          </div>

          <Input
            label="Discount (%)"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.tax_rate}
            onChange={(e) =>
              updateForm("tax_rate", parseFloat(e.target.value) || 0)
            }
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.has_stamp}
              onChange={(e) => updateForm("has_stamp", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Show official stamp overlay
          </label>

          {/* Line items */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Line Items
              </h3>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-surface-muted/30 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">
                      Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Item Description
                    </label>
                    <textarea
                      value={item.product_name}
                      onChange={(e) =>
                        updateItem(item.id, "product_name", e.target.value)
                      }
                      placeholder="Product, service, or detailed description"
                      rows={3}
                      className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Unit Price"
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unit_price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseFloat(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Terms & Notes (optional)"
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
            placeholder="One term per line (optional — defaults to standard terms)"
          />

          {initialDocument?.type === "quotation" && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleConvert}
              disabled={isPending}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Convert to Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Right panel — live preview */}
      <div className="invoice-preview-panel flex-1 overflow-y-auto bg-gray-100 p-6 lg:p-8">
        <div className="no-print mb-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Live Document Preview
          </p>
        </div>
        <DocumentCanvas
          type={form.type}
          status={form.status}
          documentNumber={form.document_number}
          issueDate={form.issue_date}
          dueDate={form.due_date}
          client={selectedClient}
          profile={previewProfile}
          items={form.items}
          taxRate={form.tax_rate}
          hasStamp={form.has_stamp}
          notes={form.notes}
        />
      </div>
    </div>
  );
}
