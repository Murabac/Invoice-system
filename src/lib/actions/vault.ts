"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/actions/profiles";
import { canAccessDashboard } from "@/lib/auth/roles";
import {
  decryptVaultPayload,
  encryptVaultPayload,
  isVaultEncryptionConfigured,
  VaultEncryptionError,
} from "@/lib/crypto/vault-crypto";
import {
  VAULT_CATEGORIES,
  type VaultCategory,
} from "@/lib/constants/vault";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type { CompanyVaultEntry } from "@/lib/types/database";

export type VaultEntryInput = {
  title: string;
  category: VaultCategory;
  value: string;
  notes: string;
};

export type VaultEntryListItem = Pick<
  CompanyVaultEntry,
  "id" | "title" | "category" | "created_at" | "updated_at"
>;

export type VaultRevealResult = {
  value: string;
  notes: string;
};

function revalidateVault() {
  revalidatePath("/vault");
}

export async function requireVaultAccess() {
  const user = await getAuthUser();
  const profile = await getProfile();
  if (!user || !profile || !canAccessDashboard(profile.role)) {
    return { error: "Unauthorized" as const, user: null, profile: null };
  }
  return { error: null, user, profile };
}

export async function getVaultSetupStatus(): Promise<{
  encryptionConfigured: boolean;
}> {
  return { encryptionConfigured: isVaultEncryptionConfigured() };
}

function normalizeInput(input: VaultEntryInput): {
  data: VaultEntryInput;
  error?: string;
} {
  const title = input.title.trim();
  if (!title) return { data: input, error: "Title is required" };
  if (!VAULT_CATEGORIES.includes(input.category)) {
    return { data: input, error: "Invalid category" };
  }
  const value = input.value.trim();
  if (!value) return { data: input, error: "Value is required" };
  return {
    data: {
      title,
      category: input.category,
      value,
      notes: input.notes.trim(),
    },
  };
}

function mapEncryptionError(err: unknown): string {
  if (err instanceof VaultEncryptionError) return err.message;
  return "Could not encrypt or decrypt vault data";
}

export async function listVaultEntries(): Promise<VaultEntryListItem[]> {
  const check = await requireVaultAccess();
  if (check.error) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("company_vault_entries")
    .select("id, title, category, created_at, updated_at")
    .order("title", { ascending: true });

  return data ?? [];
}

export async function revealVaultEntry(
  id: string
): Promise<{ data?: VaultRevealResult; error?: string }> {
  const check = await requireVaultAccess();
  if (check.error) return { error: check.error };

  if (!isVaultEncryptionConfigured()) {
    return {
      error:
        "Vault encryption is not configured. Set VAULT_ENCRYPTION_KEY in .env.local.",
    };
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("company_vault_entries")
    .select("ciphertext, iv")
    .eq("id", id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Entry not found" };

  try {
    const payload = decryptVaultPayload(data.ciphertext, data.iv);
    return { data: payload };
  } catch (err) {
    return { error: mapEncryptionError(err) };
  }
}

export async function createVaultEntry(input: VaultEntryInput) {
  const check = await requireVaultAccess();
  if (check.error) return { error: check.error };

  const normalized = normalizeInput(input);
  if (normalized.error) return { error: normalized.error };

  if (!isVaultEncryptionConfigured()) {
    return {
      error:
        "Vault encryption is not configured. Set VAULT_ENCRYPTION_KEY in .env.local.",
    };
  }

  let sealed: { ciphertext: string; iv: string };
  try {
    sealed = encryptVaultPayload({
      value: normalized.data.value,
      notes: normalized.data.notes,
    });
  } catch (err) {
    return { error: mapEncryptionError(err) };
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from("company_vault_entries").insert({
    title: normalized.data.title,
    category: normalized.data.category,
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    created_by: check.user!.id,
  });

  if (error) return { error: error.message };

  revalidateVault();
  return { success: true };
}

export async function updateVaultEntry(id: string, input: VaultEntryInput) {
  const check = await requireVaultAccess();
  if (check.error) return { error: check.error };

  const normalized = normalizeInput(input);
  if (normalized.error) return { error: normalized.error };

  if (!isVaultEncryptionConfigured()) {
    return {
      error:
        "Vault encryption is not configured. Set VAULT_ENCRYPTION_KEY in .env.local.",
    };
  }

  let sealed: { ciphertext: string; iv: string };
  try {
    sealed = encryptVaultPayload({
      value: normalized.data.value,
      notes: normalized.data.notes,
    });
  } catch (err) {
    return { error: mapEncryptionError(err) };
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("company_vault_entries")
    .update({
      title: normalized.data.title,
      category: normalized.data.category,
      ciphertext: sealed.ciphertext,
      iv: sealed.iv,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateVault();
  return { success: true };
}

export async function deleteVaultEntry(id: string) {
  const check = await requireVaultAccess();
  if (check.error) return { error: check.error };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("company_vault_entries")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateVault();
  return { success: true };
}
