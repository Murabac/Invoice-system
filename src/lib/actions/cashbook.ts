"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type {
  CashbookEntry,
  CashbookEntryType,
} from "@/lib/types/database";

export type CashbookEntryInput = {
  entry_type: CashbookEntryType;
  amount: number;
  entry_date: string;
  description: string;
  category?: string | null;
};

export type CashbookEntryView = CashbookEntry & {
  /** User-facing label (first line item for invoice-linked rows). */
  display_description: string;
  invoice_document_number?: string | null;
};

function firstLineOfText(text: string): string {
  const line = text.trim().split(/\r?\n/)[0]?.trim();
  return line ?? "";
}

async function loadInvoiceDisplayMeta(
  supabase: Awaited<ReturnType<typeof getSupabase>>,
  invoiceIds: string[]
): Promise<Map<string, { firstLine: string; documentNumber: string }>> {
  const map = new Map<string, { firstLine: string; documentNumber: string }>();
  if (invoiceIds.length === 0) return map;

  const { data: docs } = await supabase
    .from("documents")
    .select("id, document_number")
    .in("id", invoiceIds);

  for (const doc of docs ?? []) {
    map.set(doc.id, { firstLine: "", documentNumber: doc.document_number });
  }

  const { data: items } = await supabase
    .from("document_items")
    .select("document_id, product_name, sort_order")
    .in("document_id", invoiceIds)
    .order("sort_order", { ascending: true });

  for (const item of items ?? []) {
    const row = map.get(item.document_id);
    if (!row || row.firstLine) continue;
    const firstLine = firstLineOfText(item.product_name);
    if (firstLine) row.firstLine = firstLine;
  }

  return map;
}

function enrichCashbookEntries(
  entries: CashbookEntry[],
  invoiceMeta: Map<string, { firstLine: string; documentNumber: string }>
): CashbookEntryView[] {
  return entries.map((entry) => {
    if (!entry.invoice_id) {
      return { ...entry, display_description: entry.description };
    }
    const meta = invoiceMeta.get(entry.invoice_id);
    const display_description =
      meta?.firstLine?.trim() || entry.description;
    return {
      ...entry,
      display_description,
      invoice_document_number: meta?.documentNumber ?? null,
    };
  });
}

function startOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function endOfMonthIso(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
}

export async function listCashbookEntries(filters?: {
  from?: string;
  to?: string;
}): Promise<CashbookEntryView[]> {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) return [];

  let query = supabase
    .from("cashbook_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.from) {
    query = query.gte("entry_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("entry_date", filters.to);
  }

  const { data } = await query;
  const entries = data ?? [];
  const invoiceIds = Array.from(
    new Set(
      entries
        .map((e) => e.invoice_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const invoiceMeta = await loadInvoiceDisplayMeta(supabase, invoiceIds);
  return enrichCashbookEntries(entries, invoiceMeta);
}

export async function getCashbookSummary() {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) {
    return {
      balance: 0,
      totalIncome: 0,
      totalExpense: 0,
      incomeMtd: 0,
      expenseMtd: 0,
    };
  }

  const { data: entries } = await supabase
    .from("cashbook_entries")
    .select("entry_type, amount, entry_date")
    .eq("user_id", user.id);

  const rows = entries ?? [];
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeMtd = 0;
  let expenseMtd = 0;
  const monthStart = startOfMonthIso();
  const monthEnd = endOfMonthIso();

  for (const row of rows) {
    const amount = Number(row.amount);
    if (row.entry_type === "income") {
      totalIncome += amount;
      if (row.entry_date >= monthStart && row.entry_date <= monthEnd) {
        incomeMtd += amount;
      }
    } else {
      totalExpense += amount;
      if (row.entry_date >= monthStart && row.entry_date <= monthEnd) {
        expenseMtd += amount;
      }
    }
  }

  return {
    balance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    incomeMtd,
    expenseMtd,
  };
}

export async function createEntry(input: CashbookEntryInput) {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const description = input.description.trim();
  if (!description) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };

  const { error } = await supabase.from("cashbook_entries").insert({
    user_id: user.id,
    entry_type: input.entry_type,
    amount: input.amount,
    entry_date: input.entry_date,
    description,
    category: input.category?.trim() || null,
    source: "manual",
  });

  if (error) return { error: error.message };

  revalidatePath("/treasury");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEntry(id: string, input: CashbookEntryInput) {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const description = input.description.trim();
  if (!description) return { error: "Description is required" };
  if (input.amount <= 0) return { error: "Amount must be greater than zero" };

  const { error } = await supabase
    .from("cashbook_entries")
    .update({
      entry_type: input.entry_type,
      amount: input.amount,
      entry_date: input.entry_date,
      description,
      category: input.category?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/treasury");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEntry(id: string) {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("cashbook_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/treasury");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Idempotent income row when an invoice is marked paid. */
export async function syncInvoicePaidIncome(documentId: string) {
  const supabase = await getSupabase();
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select(
      "id, user_id, type, status, grand_total, document_number, issue_date"
    )
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (docError) return { error: docError.message };
  if (!doc || doc.type !== "invoice" || doc.status !== "paid") {
    return { success: true };
  }

  const entry_date =
    doc.issue_date ?? new Date().toISOString().split("T")[0];

  const { data: firstItem } = await supabase
    .from("document_items")
    .select("product_name")
    .eq("document_id", documentId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  const firstLine = firstItem?.product_name
    ? firstLineOfText(firstItem.product_name)
    : "";
  const description =
    firstLine || `Invoice ${doc.document_number}`;
  const payload = {
    user_id: user.id,
    entry_type: "income" as const,
    amount: doc.grand_total,
    entry_date,
    description,
    category: "Sales" as string | null,
    source: "invoice" as const,
    invoice_id: doc.id,
  };

  const { data: existing } = await supabase
    .from("cashbook_entries")
    .select("id")
    .eq("invoice_id", doc.id)
    .eq("entry_type", "income")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cashbook_entries")
      .update({
        amount: payload.amount,
        entry_date: payload.entry_date,
        description: payload.description,
      })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("cashbook_entries").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/treasury");
  revalidatePath("/dashboard");
  return { success: true };
}
