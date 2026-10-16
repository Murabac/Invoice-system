"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/actions/profiles";
import { canAccessDashboard } from "@/lib/auth/roles";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type { LibraryFile, LibraryFolder } from "@/lib/types/database";
import {
  inferLibraryCategory,
  sanitizeStorageFilename,
  type LibraryFileCategory,
} from "@/lib/utils/library-files";

const LIBRARY_BUCKET = "library";
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export type LibraryFileSort = "newest" | "name" | "size";

export type LibraryFileWithMeta = LibraryFile & {
  category: LibraryFileCategory;
  uploader_email: string | null;
};

async function requireLibraryAccess() {
  const user = await getAuthUser();
  const profile = await getProfile();
  if (!user || !profile || !canAccessDashboard(profile.role)) {
    return { error: "Unauthorized" as const, user: null, profile: null };
  }
  return { error: null, user, profile };
}

function revalidateLibrary() {
  revalidatePath("/library");
}

export async function listLibraryFolders(): Promise<LibraryFolder[]> {
  const check = await requireLibraryAccess();
  if (check.error) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("library_folders")
    .select("*")
    .is("parent_id", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return data ?? [];
}

export async function createLibraryFolder(name: string) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Folder name is required" };

  const supabase = await getSupabase();
  const { error } = await supabase.from("library_folders").insert({
    name: trimmed,
    parent_id: null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A folder with this name already exists" };
    }
    return { error: error.message };
  }

  revalidateLibrary();
  return { success: true };
}

export async function renameLibraryFolder(id: string, name: string) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Folder name is required" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("library_folders")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "A folder with this name already exists" };
    }
    return { error: error.message };
  }

  revalidateLibrary();
  return { success: true };
}

export async function deleteLibraryFolder(id: string) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const supabase = await getSupabase();
  const { count } = await supabase
    .from("library_files")
    .select("id", { count: "exact", head: true })
    .eq("folder_id", id);

  if (count && count > 0) {
    return { error: "Move or delete files in this folder first" };
  }

  const { error } = await supabase
    .from("library_folders")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateLibrary();
  return { success: true };
}

export async function listLibraryFiles(options?: {
  folderId?: string | null;
  category?: LibraryFileCategory | "all";
  query?: string;
  sort?: LibraryFileSort;
}): Promise<LibraryFileWithMeta[]> {
  const check = await requireLibraryAccess();
  if (check.error) return [];

  const supabase = await getSupabase();
  let query = supabase.from("library_files").select("*");

  const folderId = options?.folderId;
  if (folderId === "uncategorized") {
    query = query.is("folder_id", null);
  } else if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  const sort = options?.sort ?? "newest";
  if (sort === "name") {
    query = query.order("title", { ascending: true });
  } else if (sort === "size") {
    query = query.order("file_size_bytes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: files } = await query;
  const rows = files ?? [];

  const categoryFilter = options?.category ?? "all";
  const q = options?.query?.trim().toLowerCase() ?? "";

  const uploaderIds = Array.from(new Set(rows.map((f) => f.uploaded_by)));
  const emailByUser = new Map<string, string | null>();
  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", uploaderIds);
    for (const p of profiles ?? []) {
      emailByUser.set(p.id, p.email);
    }
  }

  let result: LibraryFileWithMeta[] = rows.map((file) => ({
    ...file,
    category: inferLibraryCategory(file.mime_type, file.original_filename),
    uploader_email: emailByUser.get(file.uploaded_by) ?? null,
  }));

  if (categoryFilter !== "all") {
    result = result.filter((f) => f.category === categoryFilter);
  }

  if (q) {
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.original_filename.toLowerCase().includes(q)
    );
  }

  return result;
}

export async function uploadLibraryFiles(formData: FormData) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const folderRaw = formData.get("folder_id");
  const folder_id =
    folderRaw && String(folderRaw) !== "" && String(folderRaw) !== "uncategorized"
      ? String(folderRaw)
      : null;

  const files = formData.getAll("files").filter((f) => f instanceof File) as File[];
  if (files.length === 0) return { error: "No files selected" };

  const supabase = await getSupabase();
  const uploaded: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size === 0) {
      errors.push(`${file.name}: empty file`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name}: exceeds 50 MB limit`);
      continue;
    }

    const category = inferLibraryCategory(file.type, file.name);
    if (category === "other") {
      errors.push(
        `${file.name}: unsupported type (PDF, Word, or PowerPoint only)`
      );
      continue;
    }

    const id = randomUUID();
    const safeName = sanitizeStorageFilename(file.name);
    const storage_path = `${id}/${safeName}`;
    const title = safeName.replace(/\.[^.]+$/, "") || safeName;

    const { error: uploadError } = await supabase.storage
      .from(LIBRARY_BUCKET)
      .upload(storage_path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { error: insertError } = await supabase.from("library_files").insert({
      id,
      folder_id,
      title,
      original_filename: file.name,
      storage_path,
      mime_type: file.type || "application/octet-stream",
      file_size_bytes: file.size,
      uploaded_by: check.user!.id,
    });

    if (insertError) {
      await supabase.storage.from(LIBRARY_BUCKET).remove([storage_path]);
      errors.push(`${file.name}: ${insertError.message}`);
      continue;
    }

    uploaded.push(file.name);
  }

  revalidateLibrary();

  if (uploaded.length === 0) {
    return { error: errors.join("; ") || "Upload failed" };
  }

  return {
    success: true,
    uploadedCount: uploaded.length,
    errors: errors.length ? errors : undefined,
  };
}

export async function updateLibraryFile(
  id: string,
  data: { title?: string; folder_id?: string | null }
) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const updates: { title?: string; folder_id?: string | null } = {};
  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) return { error: "Title is required" };
    updates.title = title;
  }
  if (data.folder_id !== undefined) {
    updates.folder_id = data.folder_id;
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("library_files")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateLibrary();
  return { success: true };
}

export async function deleteLibraryFile(id: string) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const supabase = await getSupabase();
  const { data: file } = await supabase
    .from("library_files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!file) return { error: "File not found" };

  const { error: deleteRowError } = await supabase
    .from("library_files")
    .delete()
    .eq("id", id);

  if (deleteRowError) return { error: deleteRowError.message };

  await supabase.storage.from(LIBRARY_BUCKET).remove([file.storage_path]);

  revalidateLibrary();
  return { success: true };
}

export async function getLibraryFileSignedUrl(id: string) {
  const check = await requireLibraryAccess();
  if (check.error) return { error: check.error };

  const supabase = await getSupabase();
  const { data: file } = await supabase
    .from("library_files")
    .select("storage_path, mime_type, title, original_filename")
    .eq("id", id)
    .maybeSingle();

  if (!file) return { error: "File not found" };

  const { data, error } = await supabase.storage
    .from(LIBRARY_BUCKET)
    .createSignedUrl(file.storage_path, 3600);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Could not create download link" };
  }

  return {
    success: true,
    url: data.signedUrl,
    mimeType: file.mime_type,
    title: file.title,
    filename: file.original_filename,
  };
}

export async function getLibraryStats() {
  const check = await requireLibraryAccess();
  if (check.error) return { fileCount: 0, totalBytes: 0 };

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("library_files")
    .select("file_size_bytes");

  const rows = data ?? [];
  return {
    fileCount: rows.length,
    totalBytes: rows.reduce((sum, r) => sum + Number(r.file_size_bytes), 0),
  };
}
