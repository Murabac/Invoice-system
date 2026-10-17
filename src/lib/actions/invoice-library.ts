"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/actions/profiles";
import { requireLibraryAccess } from "@/lib/actions/library";
import {
  buildInvoicePdfBytes,
  invoiceLibraryTitle,
} from "@/lib/invoices/generate-invoice-pdf";
import { getSupabase } from "@/lib/supabase/get-user";
import type { Client, Document, DocumentItem, DocumentWithRelations } from "@/lib/types/database";
import { sanitizeStorageFilename } from "@/lib/utils/library-files";

const LIBRARY_BUCKET = "library";
const INVOICES_FOLDER_NAME = "Invoices";

async function fetchInvoiceDocument(
  documentId: string
): Promise<DocumentWithRelations | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("*, clients(*), document_items(*)")
    .eq("id", documentId)
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

async function ensureInvoicesFolderId(): Promise<string | null> {
  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("library_folders")
    .select("id, name")
    .is("parent_id", null);

  const match = (existing ?? []).find(
    (f) => f.name.trim().toLowerCase() === INVOICES_FOLDER_NAME.toLowerCase()
  );
  if (match) return match.id;

  const { data: created, error } = await supabase
    .from("library_folders")
    .insert({ name: INVOICES_FOLDER_NAME })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id;
}

/** Archive or refresh invoice PDF in the shared File library (Invoices folder). */
export async function syncInvoicePdfToLibrary(documentId: string) {
  const check = await requireLibraryAccess();
  if (check.error || !check.user) {
    return { skipped: true as const };
  }

  const doc = await fetchInvoiceDocument(documentId);
  if (!doc || doc.type !== "invoice") {
    return { success: true as const };
  }

  const folderId = await ensureInvoicesFolderId();
  if (!folderId) {
    return { error: "Could not create Invoices folder" };
  }

  const profile = await getProfile();
  const pdfBytes = await buildInvoicePdfBytes(doc, profile);
  const title = invoiceLibraryTitle(doc);
  const original_filename = `${doc.document_number.replace(/[\\/:*?"<>|]/g, "-")}.pdf`;

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("library_files")
    .select("id, storage_path")
    .eq("document_id", documentId)
    .maybeSingle();

  const fileId = existing?.id ?? randomUUID();
  const storage_path =
    existing?.storage_path ??
    `${fileId}/${sanitizeStorageFilename(original_filename)}`;

  const { error: uploadError } = await supabase.storage
    .from(LIBRARY_BUCKET)
    .upload(storage_path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("library_files")
      .update({
        folder_id: folderId,
        title,
        original_filename,
        mime_type: "application/pdf",
        file_size_bytes: pdfBytes.byteLength,
      })
      .eq("id", existing.id);

    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase.from("library_files").insert({
      id: fileId,
      folder_id: folderId,
      title,
      original_filename,
      storage_path,
      mime_type: "application/pdf",
      file_size_bytes: pdfBytes.byteLength,
      uploaded_by: check.user.id,
      document_id: documentId,
    });

    if (insertError) {
      await supabase.storage.from(LIBRARY_BUCKET).remove([storage_path]);
      return { error: insertError.message };
    }
  }

  revalidatePath("/library");
  return { success: true as const };
}
