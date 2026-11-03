"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  MinusCircle,
  Pencil,
  Plus,
  PlusCircle,
  Trash2,
} from "lucide-react";
import {
  createAccount,
  deleteAccount,
  deleteAccountTransaction,
  spendFromAccount,
  topUpAccount,
  updateAccount,
  updateAccountTransaction,
  type AccountInput,
  type AccountWithBalance,
} from "@/lib/actions/accounts";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/format";
import type { AccountTransaction, AccountTxnType } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface AccountsPanelProps {
  accounts: AccountWithBalance[];
  transactions: AccountTransaction[];
}

type PanelMode =
  | { kind: "create" }
  | { kind: "edit"; accountId: string }
  | { kind: "top_up"; accountId: string }
  | { kind: "spend"; accountId: string }
  | {
      kind: "edit_txn";
      accountId: string;
      txnId: string;
      txnType: AccountTxnType;
    }
  | null;

const emptyAccountForm = (): AccountInput => ({
  name: "",
  notes: "",
});

const emptyTxnForm = () => ({
  amount: 0,
  txn_date: new Date().toISOString().split("T")[0],
  description: "",
});

export function AccountsPanel({ accounts, transactions }: AccountsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(
    accounts[0]?.id ?? null
  );
  const [mode, setMode] = useState<PanelMode>(null);
  const [accountForm, setAccountForm] = useState<AccountInput>(emptyAccountForm);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount =
    accounts.find((a) => a.id === selectedId) ?? accounts[0] ?? null;

  const selectedTxns = useMemo(() => {
    if (!selectedAccount) return [];
    return transactions.filter((t) => t.account_id === selectedAccount.id);
  }, [transactions, selectedAccount]);

  function openCreate() {
    setMode({ kind: "create" });
    setAccountForm(emptyAccountForm());
    setError(null);
  }

  function openEdit(account: AccountWithBalance) {
    setSelectedId(account.id);
    setMode({ kind: "edit", accountId: account.id });
    setAccountForm({ name: account.name, notes: account.notes ?? "" });
    setError(null);
  }

  function openTopUp(account: AccountWithBalance) {
    setSelectedId(account.id);
    setMode({ kind: "top_up", accountId: account.id });
    setTxnForm(emptyTxnForm());
    setError(null);
  }

  function openSpend(account: AccountWithBalance) {
    setSelectedId(account.id);
    setMode({ kind: "spend", accountId: account.id });
    setTxnForm(emptyTxnForm());
    setError(null);
  }

  function openEditTxn(txn: AccountTransaction) {
    setSelectedId(txn.account_id);
    setMode({
      kind: "edit_txn",
      accountId: txn.account_id,
      txnId: txn.id,
      txnType: txn.txn_type,
    });
    setTxnForm({
      amount: Number(txn.amount),
      txn_date: txn.txn_date,
      description: txn.description,
    });
    setError(null);
  }

  function closeForm() {
    setMode(null);
    setError(null);
  }

  function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!mode || (mode.kind !== "create" && mode.kind !== "edit")) return;

    startTransition(async () => {
      const result =
        mode.kind === "edit"
          ? await updateAccount(mode.accountId, accountForm)
          : await createAccount(accountForm);

      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      router.refresh();
    });
  }

  function handleTxnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (
      !mode ||
      (mode.kind !== "top_up" &&
        mode.kind !== "spend" &&
        mode.kind !== "edit_txn")
    ) {
      return;
    }

    startTransition(async () => {
      const fields = {
        amount: txnForm.amount,
        txn_date: txnForm.txn_date,
        description: txnForm.description,
      };

      let result: { error?: string; success?: boolean };
      if (mode.kind === "edit_txn") {
        result = await updateAccountTransaction(mode.txnId, fields);
      } else if (mode.kind === "top_up") {
        result = await topUpAccount({ accountId: mode.accountId, ...fields });
      } else {
        result = await spendFromAccount({ accountId: mode.accountId, ...fields });
      }

      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      router.refresh();
    });
  }

  function handleDelete(account: AccountWithBalance) {
    if (!confirm(`Delete account “${account.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteAccount(account.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (selectedId === account.id) {
        setSelectedId(null);
      }
      closeForm();
      router.refresh();
    });
  }

  function handleDeleteTxn(txn: AccountTransaction) {
    const label = txn.txn_type === "top_up" ? "top-up" : "spend";
    const extra =
      txn.txn_type === "top_up" && txn.cashbook_entry_id
        ? " This will also remove the linked treasury expense."
        : "";
    if (!confirm(`Delete this ${label} record?${extra}`)) return;
    startTransition(async () => {
      const result = await deleteAccountTransaction(txn.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeForm();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      {error && !mode && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">
            No accounts yet. Add Dahabshiil, a Mastercard, or any prepaid wallet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const active = selectedAccount?.id === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  setSelectedId(account.id);
                  setError(null);
                }}
                className={cn(
                  "rounded-xl border bg-surface p-5 text-left shadow-card transition-colors",
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {account.name}
                    </p>
                    {account.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {account.notes}
                      </p>
                    )}
                  </div>
                  <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {account.balance_source === "treasury"
                    ? "Treasury current balance"
                    : `${account.transaction_count} transaction${
                        account.transaction_count === 1 ? "" : "s"
                      }`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selectedAccount && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedAccount.name}
              </h2>
              <p className="text-sm text-gray-500">
                Balance {formatCurrency(selectedAccount.balance)}
                {selectedAccount.balance_source === "treasury"
                  ? " · mirrors Treasury"
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAccount.balance_source !== "treasury" && (
                <>
                  <Button
                    type="button"
                    onClick={() => openTopUp(selectedAccount)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Top up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openSpend(selectedAccount)}
                  >
                    <MinusCircle className="h-4 w-4" />
                    Record spend
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => openEdit(selectedAccount)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleDelete(selectedAccount)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-card">
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
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedAccount.balance_source === "treasury" ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        This account always shows the Treasury current balance
                        (total income − total expenses). Manage money in
                        Treasury — Mastercard top-ups reduce this balance
                        automatically.
                      </td>
                    </tr>
                  ) : selectedTxns.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No transactions yet. Top up this account to fund its
                        balance (creates a treasury expense), then record spends
                        that only reduce the card balance.
                      </td>
                    </tr>
                  ) : (
                    selectedTxns.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                          {txn.txn_date}
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-700">
                          {txn.txn_type === "top_up" ? "Top up" : "Spend"}
                          {txn.txn_type === "top_up" && txn.cashbook_entry_id && (
                            <span className="mt-0.5 block text-xs text-gray-400">
                              Linked to treasury
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {txn.description}
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-4 py-3 text-right font-medium",
                            txn.txn_type === "top_up"
                              ? "text-green-700"
                              : "text-red-700"
                          )}
                        >
                          {txn.txn_type === "top_up" ? "+" : "−"}
                          {formatCurrency(Number(txn.amount))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-primary"
                              aria-label="Edit transaction"
                              onClick={() => openEditTxn(txn)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete transaction"
                              disabled={isPending}
                              onClick={() => handleDeleteTxn(txn)}
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
      )}

      {mode && (mode.kind === "create" || mode.kind === "edit") && (
        <form
          onSubmit={handleAccountSubmit}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {mode.kind === "edit" ? "Edit account" : "New account"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                required
                value={accountForm.name}
                onChange={(e) =>
                  setAccountForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Premier Mastercard"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <Input
                value={accountForm.notes ?? ""}
                onChange={(e) =>
                  setAccountForm((f) => ({ ...f, notes: e.target.value }))
                }
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

      {mode &&
        (mode.kind === "top_up" ||
          mode.kind === "spend" ||
          mode.kind === "edit_txn") && (
        <form
          onSubmit={handleTxnSubmit}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            {mode.kind === "edit_txn"
              ? mode.txnType === "top_up"
                ? "Edit top up"
                : "Edit spend"
              : mode.kind === "top_up"
                ? "Top up account"
                : "Record spend"}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {mode.kind === "edit_txn"
              ? mode.txnType === "top_up"
                ? "Updates this top-up and its linked treasury expense (if any)."
                : "Updates this spend on the card only."
              : mode.kind === "top_up"
                ? "Creates a treasury expense and increases this account’s balance."
                : "Deducts from this account only — no new treasury expense."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date
              </label>
              <Input
                type="date"
                required
                value={txnForm.txn_date}
                onChange={(e) =>
                  setTxnForm((f) => ({ ...f, txn_date: e.target.value }))
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
                value={txnForm.amount || ""}
                onChange={(e) =>
                  setTxnForm((f) => ({
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
                value={txnForm.description}
                onChange={(e) =>
                  setTxnForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder={
                  mode.kind === "top_up" ||
                  (mode.kind === "edit_txn" && mode.txnType === "top_up")
                    ? "Server monthly prepaid load"
                    : "Cursor subscription"
                }
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving…"
                : mode.kind === "edit_txn"
                  ? "Save changes"
                  : mode.kind === "top_up"
                    ? "Top up"
                    : "Record spend"}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
