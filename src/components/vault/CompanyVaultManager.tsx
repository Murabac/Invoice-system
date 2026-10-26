"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createVaultEntry,
  deleteVaultEntry,
  revealVaultEntry,
  updateVaultEntry,
  type VaultEntryInput,
  type VaultEntryListItem,
} from "@/lib/actions/vault";
import {
  VAULT_CATEGORIES,
  VAULT_CATEGORY_LABELS,
  type VaultCategory,
} from "@/lib/constants/vault";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CompanyVaultManagerProps {
  entries: VaultEntryListItem[];
  encryptionConfigured: boolean;
}

const emptyForm = (): VaultEntryInput => ({
  title: "",
  category: "password",
  value: "",
  notes: "",
});

export function CompanyVaultManager({
  entries,
  encryptionConfigured,
}: CompanyVaultManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VaultEntryInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<
    Record<string, { value: string; notes: string }>
  >({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [showFormValue, setShowFormValue] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setShowFormValue(false);
    setError(null);
  }

  function openEdit(row: VaultEntryListItem) {
    setEditingId(row.id);
    setForm({
      title: row.title,
      category: row.category,
      value: revealed[row.id]?.value ?? "",
      notes: revealed[row.id]?.notes ?? "",
    });
    setFormOpen(true);
    setShowFormValue(Boolean(revealed[row.id]));
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setShowFormValue(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editingId
        ? await updateVaultEntry(editingId, form)
        : await createVaultEntry(form);

      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      setRevealed({});
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this vault entry permanently?")) return;
    startTransition(async () => {
      const result = await deleteVaultEntry(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.refresh();
    });
  }

  function handleReveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setRevealingId(id);
    startTransition(async () => {
      const result = await revealVaultEntry(id);
      setRevealingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setRevealed((prev) => ({ ...prev, [id]: result.data! }));
      }
    });
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function loadIntoEdit(id: string) {
    setRevealingId(id);
    startTransition(async () => {
      const result = await revealVaultEntry(id);
      setRevealingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setRevealed((prev) => ({ ...prev, [id]: result.data! }));
        setForm((f) => ({
          ...f,
          value: result.data!.value,
          notes: result.data!.notes,
        }));
        setShowFormValue(true);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">Secure company vault</p>
        <p className="mt-1 text-amber-900/90">
          Passwords, DUNS numbers, and registered addresses are encrypted before
          storage. Only admins can access this page. Values are shown only when
          you click Reveal.
        </p>
        {!encryptionConfigured && (
          <p className="mt-2 font-medium text-red-800">
            Add{" "}
            <code className="rounded bg-white/80 px-1">VAULT_ENCRYPTION_KEY</code>{" "}
            to <code className="rounded bg-white/80 px-1">.env.local</code>{" "}
            (generate with{" "}
            <code className="rounded bg-white/80 px-1">openssl rand -hex 32</code>
            ), then restart the app.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={openCreate}
          disabled={!encryptionConfigured}
        >
          <Plus className="h-4 w-4" />
          Add entry
        </Button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <KeyRound className="h-5 w-5 text-primary" />
            {editingId ? "Edit vault entry" : "New vault entry"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Production server SSH, DUNS number, HQ address…"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as VaultCategory,
                  }))
                }
              >
                {VAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {VAULT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Secret value
                </label>
                {editingId && !form.value && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => loadIntoEdit(editingId)}
                  >
                    Load current value
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  required
                  type={showFormValue ? "text" : "password"}
                  autoComplete="off"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder="Password, DUNS, full address…"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
                  onClick={() => setShowFormValue((v) => !v)}
                  title={showFormValue ? "Hide" : "Show"}
                >
                  {showFormValue ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Username, URL, renewal contact…"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isPending || !encryptionConfigured}>
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
                  Title
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Value
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Updated
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
                    colSpan={5}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No vault entries yet. Store server passwords, DUNS, and
                    registered addresses here.
                  </td>
                </tr>
              ) : (
                entries.map((row) => {
                  const open = revealed[row.id];
                  const loading = revealingId === row.id && isPending;
                  return (
                    <tr key={row.id} className="align-top hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.title}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {VAULT_CATEGORY_LABELS[row.category]}
                      </td>
                      <td className="max-w-md px-4 py-3 text-gray-700">
                        {loading ? (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                          </span>
                        ) : open ? (
                          <div className="space-y-2">
                            <p className="whitespace-pre-wrap break-all font-mono text-xs">
                              {open.value}
                            </p>
                            {open.notes ? (
                              <p className="whitespace-pre-wrap text-xs text-gray-500">
                                {open.notes}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="font-mono text-gray-400">
                            ••••••••
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.updated_at.split("T")[0]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleReveal(row.id)}
                            disabled={!encryptionConfigured || loading}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                            title={open ? "Hide" : "Reveal"}
                          >
                            {open ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          {open && (
                            <button
                              type="button"
                              onClick={() => copyText(open.value)}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                              title="Copy value"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
