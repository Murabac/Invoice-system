"use server";

import { revalidatePath } from "next/cache";
import { getCashbookSummary } from "@/lib/actions/cashbook";
import { getProfile } from "@/lib/actions/profiles";
import { canAccessDashboard } from "@/lib/auth/roles";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type {
  Account,
  AccountTransaction,
  AccountTxnType,
} from "@/lib/types/database";

export type AccountInput = {
  name: string;
  notes?: string | null;
};

export type AccountTxnInput = {
  accountId: string;
  amount: number;
  txn_date: string;
  description: string;
};

export type AccountWithBalance = Account & {
  balance: number;
  transaction_count: number;
};

function revalidateAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/treasury");
  revalidatePath("/dashboard");
}

export async function requireAccountsAccess() {
  const user = await getAuthUser();
  const profile = await getProfile();
  if (!user || !profile || !canAccessDashboard(profile.role)) {
    return { error: "Unauthorized" as const, user: null, profile: null };
  }
  return { error: null, user, profile };
}

function computeBalance(txns: { txn_type: AccountTxnType; amount: number }[]) {
  let balance = 0;
  for (const txn of txns) {
    const amount = Number(txn.amount);
    if (txn.txn_type === "top_up") balance += amount;
    else balance -= amount;
  }
  return balance;
}

export async function listAccountsWithBalances(): Promise<AccountWithBalance[]> {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return [];

  const supabase = await getSupabase();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .order("name", { ascending: true });

  const rows = accounts ?? [];
  if (rows.length === 0) return [];

  const needsTreasury = rows.some((a) => a.balance_source === "treasury");
  const treasuryBalance = needsTreasury
    ? (await getCashbookSummary()).balance
    : 0;

  const { data: txns } = await supabase
    .from("account_transactions")
    .select("account_id, txn_type, amount");

  const byAccount = new Map<
    string,
    { txn_type: AccountTxnType; amount: number }[]
  >();
  for (const txn of txns ?? []) {
    const list = byAccount.get(txn.account_id) ?? [];
    list.push({
      txn_type: txn.txn_type,
      amount: Number(txn.amount),
    });
    byAccount.set(txn.account_id, list);
  }

  return rows.map((account) => {
    const list = byAccount.get(account.id) ?? [];
    const isTreasuryLinked = account.balance_source === "treasury";
    return {
      ...account,
      balance: isTreasuryLinked ? treasuryBalance : computeBalance(list),
      transaction_count: list.length,
    };
  });
}

export async function listAccountTransactions(
  accountId?: string
): Promise<AccountTransaction[]> {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return [];

  const supabase = await getSupabase();
  let query = supabase
    .from("account_transactions")
    .select("*")
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data } = await query;
  return data ?? [];
}

export async function createAccount(input: AccountInput) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await getSupabase();
  const { error } = await supabase.from("accounts").insert({
    name,
    notes: input.notes?.trim() || null,
    created_by: access.user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "An account with that name already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return { success: true };
}

export async function updateAccount(id: string, input: AccountInput) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const name = input.name.trim();
  if (!name) return { error: "Name is required" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("accounts")
    .update({
      name,
      notes: input.notes?.trim() || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "An account with that name already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteAccount(id: string) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const supabase = await getSupabase();
  const { count, error: countError } = await supabase
    .from("account_transactions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", id);

  if (countError) return { error: countError.message };
  if ((count ?? 0) > 0) {
    return {
      error: "Cannot delete an account that has transactions. Clear history first.",
    };
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return { success: true };
}

async function getAccountBalance(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  accountId: string,
  excludeTxnId?: string
): Promise<number> {
  const { data: txns } = await supabase
    .from("account_transactions")
    .select("id, txn_type, amount")
    .eq("account_id", accountId);

  return computeBalance(
    (txns ?? [])
      .filter((t) => t.id !== excludeTxnId)
      .map((t) => ({
        txn_type: t.txn_type,
        amount: Number(t.amount),
      }))
  );
}

export async function topUpAccount(input: AccountTxnInput) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const description = input.description.trim();
  if (!description) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date)) {
    return { error: "Invalid date" };
  }

  const supabase = await getSupabase();

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, name, balance_source")
    .eq("id", input.accountId)
    .maybeSingle();

  if (accountError) return { error: accountError.message };
  if (!account) return { error: "Account not found" };
  if (account.balance_source === "treasury") {
    return {
      error:
        "This account always mirrors Treasury current balance. Add income or expenses in Treasury instead.",
    };
  }

  const { data: cashbookEntry, error: cashbookError } = await supabase
    .from("cashbook_entries")
    .insert({
      user_id: access.user.id,
      entry_type: "expense",
      amount: input.amount,
      entry_date: input.txn_date,
      description: `${account.name}: ${description}`,
      category: "Account top-up",
      source: "manual",
    })
    .select("id")
    .single();

  if (cashbookError || !cashbookEntry) {
    return { error: cashbookError?.message ?? "Failed to create treasury expense" };
  }

  const { error: txnError } = await supabase.from("account_transactions").insert({
    account_id: input.accountId,
    txn_type: "top_up",
    amount: input.amount,
    txn_date: input.txn_date,
    description,
    cashbook_entry_id: cashbookEntry.id,
    created_by: access.user.id,
  });

  if (txnError) {
    await supabase
      .from("cashbook_entries")
      .delete()
      .eq("id", cashbookEntry.id)
      .eq("user_id", access.user.id);
    return { error: txnError.message };
  }

  revalidateAccounts();
  return { success: true };
}

export async function spendFromAccount(input: AccountTxnInput) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const description = input.description.trim();
  if (!description) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date)) {
    return { error: "Invalid date" };
  }

  const supabase = await getSupabase();

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, balance_source")
    .eq("id", input.accountId)
    .maybeSingle();

  if (accountError) return { error: accountError.message };
  if (!account) return { error: "Account not found" };
  if (account.balance_source === "treasury") {
    return {
      error:
        "This account always mirrors Treasury current balance. Add income or expenses in Treasury instead.",
    };
  }

  const balance = await getAccountBalance(supabase, input.accountId);
  if (input.amount > balance) {
    return {
      error: `Insufficient balance. Available: ${balance.toFixed(2)}`,
    };
  }

  const { error } = await supabase.from("account_transactions").insert({
    account_id: input.accountId,
    txn_type: "spend",
    amount: input.amount,
    txn_date: input.txn_date,
    description,
    cashbook_entry_id: null,
    created_by: access.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return { success: true };
}

export async function updateAccountTransaction(
  id: string,
  input: Omit<AccountTxnInput, "accountId">
) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const description = input.description.trim();
  if (!description) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.txn_date)) {
    return { error: "Invalid date" };
  }

  const supabase = await getSupabase();
  const { data: txn, error: txnError } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (txnError) return { error: txnError.message };
  if (!txn) return { error: "Transaction not found" };

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, name, balance_source")
    .eq("id", txn.account_id)
    .maybeSingle();

  if (accountError) return { error: accountError.message };
  if (!account) return { error: "Account not found" };
  if (account.balance_source === "treasury") {
    return { error: "Cannot edit transactions on a treasury-linked account" };
  }

  if (txn.txn_type === "spend") {
    const available = await getAccountBalance(supabase, txn.account_id, id);
    if (input.amount > available) {
      return {
        error: `Insufficient balance. Available: ${available.toFixed(2)}`,
      };
    }
  }

  const { error: updateError } = await supabase
    .from("account_transactions")
    .update({
      amount: input.amount,
      txn_date: input.txn_date,
      description,
    })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  if (txn.txn_type === "top_up" && txn.cashbook_entry_id) {
    const { error: cashbookError } = await supabase
      .from("cashbook_entries")
      .update({
        amount: input.amount,
        entry_date: input.txn_date,
        description: `${account.name}: ${description}`,
      })
      .eq("id", txn.cashbook_entry_id);

    if (cashbookError) return { error: cashbookError.message };
    revalidateAccounts();
  } else {
    revalidatePath("/accounts");
  }

  return { success: true };
}

export async function deleteAccountTransaction(id: string) {
  const access = await requireAccountsAccess();
  if (access.error || !access.user) return { error: "Unauthorized" };

  const supabase = await getSupabase();
  const { data: txn, error: txnError } = await supabase
    .from("account_transactions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (txnError) return { error: txnError.message };
  if (!txn) return { error: "Transaction not found" };

  const cashbookId = txn.cashbook_entry_id;

  const { error: deleteError } = await supabase
    .from("account_transactions")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  if (cashbookId) {
    await supabase.from("cashbook_entries").delete().eq("id", cashbookId);
    revalidateAccounts();
  } else {
    revalidatePath("/accounts");
  }

  return { success: true };
}
