"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import {
  logoPresetToUrl,
  type LogoPreset,
} from "@/lib/constants/logos";
import { DEFAULT_TERMS, COMPANY_INFO } from "@/lib/constants/company";
import type { InvoiceHeaderTheme, InvoiceStampPreset, Profile } from "@/lib/types/database";

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

function revalidateLogoPaths() {
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/documents", "layout");
  revalidatePath("/", "layout");
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function updateProfile(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const company_name = formData.get("company_name") as string;
  const website_url = formData.get("website_url") as string;

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ company_name, website_url })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidateLogoPaths();
  return { success: true };
}

async function ensureProfileUpdate(
  userId: string,
  updates: Partial<
    Pick<
      Profile,
      | "dashboard_header_text"
      | "company_name"
      | "invoice_header_theme"
      | "invoice_stamp"
      | "default_terms"
      | "contact_name"
      | "contact_phone_1"
      | "contact_phone_2"
      | "dashboard_logo_url"
      | "logo_url"
    >
  >
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await getSupabase();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };

  if (!updated) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      company_name:
        updates.company_name ??
        updates.dashboard_header_text ??
        "Biloop Technology Innovators",
      website_url: "https://biloop.com",
      dashboard_header_text:
        updates.dashboard_header_text ?? "Biloop Technology Innovators",
      invoice_header_theme: updates.invoice_header_theme ?? "blue",
      invoice_stamp: updates.invoice_stamp ?? "biloop",
      default_terms: updates.default_terms ?? DEFAULT_TERMS,
      contact_name: updates.contact_name ?? COMPANY_INFO.contactName,
      contact_phone_1: updates.contact_phone_1 ?? COMPANY_INFO.contactPhone,
      contact_phone_2: updates.contact_phone_2 ?? COMPANY_INFO.contactPhone2,
      logo_url: updates.logo_url ?? "/logo.jpeg",
      dashboard_logo_url: updates.dashboard_logo_url ?? "/logo.jpeg",
      role: "admin",
    });
    if (insertError) return { error: insertError.message };
  }

  return { success: true };
}

export async function updateDashboardHeaderText(text: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const dashboard_header_text = text.trim();
  if (!dashboard_header_text) {
    return { error: "Header text cannot be empty" };
  }

  const result = await ensureProfileUpdate(user.id, {
    dashboard_header_text,
    company_name: dashboard_header_text,
  });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateInvoiceHeaderTheme(theme: InvoiceHeaderTheme) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  if (theme !== "blue" && theme !== "gradient" && theme !== "h24") {
    return { error: "Invalid theme" };
  }

  const result = await ensureProfileUpdate(user.id, {
    invoice_header_theme: theme as InvoiceHeaderTheme,
  });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateInvoiceStampPreset(preset: InvoiceStampPreset) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  if (preset !== "biloop" && preset !== "h24") {
    return { error: "Invalid stamp" };
  }

  const result = await ensureProfileUpdate(user.id, { invoice_stamp: preset });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateDefaultTerms(terms: string[]) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const default_terms = terms
    .map((term) => term.trim())
    .filter(Boolean);

  if (default_terms.length > 50) {
    return { error: "Maximum 50 terms allowed" };
  }

  const result = await ensureProfileUpdate(user.id, { default_terms });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateInvoiceContact(data: {
  contactName: string;
  contactPhone1: string;
  contactPhone2: string;
}) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const contact_name = data.contactName.trim();
  const contact_phone_1 = data.contactPhone1.trim();
  const contact_phone_2 = data.contactPhone2.trim();

  if (!contact_name) {
    return { error: "Contact name is required" };
  }
  if (!contact_phone_1) {
    return { error: "At least one mobile phone is required" };
  }

  const result = await ensureProfileUpdate(user.id, {
    contact_name,
    contact_phone_1,
    contact_phone_2,
  });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateDashboardLogoPreset(preset: LogoPreset) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const result = await ensureProfileUpdate(user.id, {
    dashboard_logo_url: logoPresetToUrl(preset),
  });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateInvoiceLogoPreset(preset: LogoPreset) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const result = await ensureProfileUpdate(user.id, {
    logo_url: logoPresetToUrl(preset),
  });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

async function uploadProfileLogoFile(
  target: "dashboard" | "invoice",
  formData: FormData
): Promise<{ error?: string; success?: boolean; url?: string }> {
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
  const ext = MIME_TO_EXT[file.type] ?? "jpg";
  const path = `${user.id}/profile/${target}/logo.${ext}`;

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
  const updates =
    target === "dashboard"
      ? { dashboard_logo_url: logoUrl }
      : { logo_url: logoUrl };

  const result = await ensureProfileUpdate(user.id, updates);
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true, url: logoUrl };
}

export async function uploadDashboardLogo(formData: FormData) {
  return uploadProfileLogoFile("dashboard", formData);
}

export async function uploadInvoiceLogo(formData: FormData) {
  return uploadProfileLogoFile("invoice", formData);
}
