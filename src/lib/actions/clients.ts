"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import type { Client } from "@/lib/types/database";

const LOGOS_BUCKET = "logos";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function getClients(): Promise<Client[]> {
  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  return data ?? [];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function createClientRecord(data: {
  name: string;
  address?: string;
  logo_url?: string;
}) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await getSupabase();
  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      user_id: user.id,
      name: data.name,
      address: data.address ?? null,
      logo_url: data.logo_url ?? "/client.png",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/documents");
  revalidatePath("/documents/new");
  revalidatePath("/clients");
  revalidatePath("/clients/new");
  return { client };
}

export async function updateClient(
  id: string,
  data: { name: string; address?: string }
) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const name = data.name.trim();
  if (!name) return { error: "Client name is required" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      address: data.address?.trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/clients/new");
  revalidatePath("/documents");
  return { success: true };
}

export async function deleteClient(id: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/clients/new");
  revalidatePath("/documents");
  return { success: true };
}

export async function seedDefaultClient() {
  const user = await getAuthUser();
  if (!user) return;

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  await supabase.from("clients").insert({
    user_id: user.id,
    name: "Acceptance and Change University",
    address: "123 University Avenue, Education City, EC 10001",
    logo_url: "/client.png",
  });
}

export async function uploadClientLogo(clientId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { error: "File must be 5 MB or smaller" };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { error: "Only JPEG, PNG, WebP, and GIF images are allowed" };
  }

  const supabase = await getSupabase();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return { error: "Client not found" };
  }

  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const path = `${user.id}/clients/${clientId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);

  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("clients")
    .update({ logo_url: logoUrl })
    .eq("id", clientId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/documents");
  revalidatePath("/documents/new");
  revalidatePath("/clients");
  revalidatePath("/clients/new");
  return { success: true, url: logoUrl };
}
