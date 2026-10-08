"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import {
  calculateDocumentTotals,
  calculateLineTotal,
  formatDocumentNumber,
  parseDocumentNumberSequence,
} from "@/lib/utils/format";
import { syncInvoicePaidIncome } from "@/lib/actions/cashbook";
import type {
  DocumentFormState,
  DocumentStatus,
  DocumentType,
  DocumentWithRelations,
  Document,
  DocumentItem,
  Client,
} from "@/lib/types/database";

export async function getNextDocumentNumber(
  type: DocumentType
): Promise<string> {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return formatDocumentNumber(type, 1);

  const { data: rows } = await supabase
    .from("documents")
    .select("document_number")
    .eq("user_id", user.id)
    .eq("type", type);

  let maxSeq = 0;
  for (const row of rows ?? []) {
    const seq = parseDocumentNumberSequence(type, row.document_number);
    if (seq !== null && seq > maxSeq) maxSeq = seq;
  }

  for (let bump = 1; bump <= 25; bump++) {
    const candidate = formatDocumentNumber(type, maxSeq + bump);
    const { data: existing } = await supabase
      .from("documents")
      .select("id")
      .eq("user_id", user.id)
      .eq("document_number", candidate)
      .maybeSingle();

    if (!existing) return candidate;
  }

  return formatDocumentNumber(type, maxSeq + 1);
}

export async function getDocuments(filters?: {
  type?: DocumentType | "all";
  status?: DocumentStatus | "all";
}) {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return [];

  let query = supabase
    .from("documents")
    .select("*, clients(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getDocument(id: string): Promise<DocumentWithRelations | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("documents")
    .select("*, clients(*), document_items(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const doc = data as Document & {
    clients: Client | null;
    document_items: DocumentItem[];
  };

  const items = [...(doc.document_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return { ...doc, document_items: items };
}

export async function getDashboardMetrics() {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) {
    return {
      totalInvoiced: 0,
      pendingQuotations: 0,
      issuedInvoices: 0,
      paidInvoices: 0,
    };
  }

  const { data: rows } = await supabase
    .from("documents")
    .select("type, status, grand_total")
    .eq("user_id", user.id);

  const documents = rows ?? [];
  const invoices = documents.filter((d) => d.type === "invoice");

  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + Number(inv.grand_total),
    0
  );
  const issuedInvoices = invoices.filter((i) => i.status === "issued").length;
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const pendingQuotations = documents.filter(
    (d) =>
      d.type === "quotation" &&
      (d.status === "draft" || d.status === "issued")
  ).length;

  return {
    totalInvoiced,
    pendingQuotations,
    issuedInvoices,
    paidInvoices,
  };
}

export async function saveDocument(
  formState: DocumentFormState,
  documentId?: string
) {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return { error: "Unauthorized" };

  const { subtotal, tax, grandTotal } = calculateDocumentTotals(
    formState.items,
    formState.tax_rate
  );

  const hasStamp =
    formState.has_stamp ||
    (formState.type === "invoice" && formState.status === "issued");

  const docPayload = {
    user_id: user.id,
    type: formState.type,
    document_number: formState.document_number,
    status: formState.status,
    issue_date: formState.issue_date || null,
    due_date: formState.due_date || null,
    client_id: formState.client_id || null,
    subtotal,
    tax,
    tax_rate: formState.tax_rate,
    grand_total: grandTotal,
    has_stamp: hasStamp,
    hide_client_name: formState.hide_client_name,
    notes: formState.notes || null,
  };

  let savedDocId = documentId;

  if (documentId) {
    const { error } = await supabase
      .from("documents")
      .update(docPayload)
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    await supabase.from("document_items").delete().eq("document_id", documentId);
  } else {
    const { data, error } = await supabase
      .from("documents")
      .insert(docPayload)
      .select("id")
      .single();

    if (error) return { error: error.message };
    savedDocId = data.id;
  }

  const itemsPayload = formState.items
    .filter((item) => item.product_name.trim())
    .map((item, index) => ({
      document_id: savedDocId!,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total: calculateLineTotal(item.unit_price, item.quantity),
      sort_order: index,
    }));

  if (itemsPayload.length > 0) {
    const { error: itemsError } = await supabase
      .from("document_items")
      .insert(itemsPayload);

    if (itemsError) return { error: itemsError.message };
  }

  if (
    formState.type === "invoice" &&
    formState.status === "paid" &&
    savedDocId
  ) {
    await syncInvoicePaidIncome(savedDocId);
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/treasury");
  return { success: true, id: savedDocId };
}

export async function convertToInvoice(quotationId: string) {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return { error: "Unauthorized" };

  const quotation = await getDocument(quotationId);
  if (!quotation || quotation.type !== "quotation") {
    return { error: "Quotation not found" };
  }

  const invoiceNumber = await getNextDocumentNumber("invoice");

  const { data: invoice, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "invoice",
      document_number: invoiceNumber,
      status: "issued",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: quotation.due_date,
      client_id: quotation.client_id,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      tax_rate: quotation.tax_rate,
      grand_total: quotation.grand_total,
      has_stamp: true,
      hide_client_name: quotation.hide_client_name,
      notes: quotation.notes,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (quotation.document_items.length > 0) {
    const items = quotation.document_items.map((item) => ({
      document_id: invoice.id,
      product_name: item.product_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      total: item.total,
      sort_order: item.sort_order,
    }));

    await supabase.from("document_items").insert(items);
  }

  await supabase
    .from("documents")
    .update({ status: "issued" })
    .eq("id", quotationId);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect(`/documents/${invoice.id}`);
}

export async function deleteDocument(id: string) {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus
) {
  const supabase = await getSupabase();
  const user = await getAuthUser();

  if (!user) return { error: "Unauthorized" };

  const updates: { status: DocumentStatus; has_stamp?: boolean } = { status };
  if (status === "issued") {
    updates.has_stamp = true;
  }

  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  if (status === "paid") {
    await syncInvoicePaidIncome(id);
  }

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/treasury");
  revalidatePath(`/documents/${id}`);
  return { success: true };
}
