"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, getSupabase } from "@/lib/supabase/get-user";
import {
  logoPresetToUrl,
  type LogoPreset,
} from "@/lib/constants/logos";
import type { InvoiceHeaderTheme, Profile } from "@/lib/types/database";

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
      | "invoice_header_theme"
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
      company_name: "Biloop Technology Innovators",
      website_url: "https://biloop.com",
      dashboard_header_text:
        updates.dashboard_header_text ?? "Biloop Technology Innovators",
      invoice_header_theme: updates.invoice_header_theme ?? "blue",
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

  const result = await ensureProfileUpdate(user.id, { dashboard_header_text });
  if (result.error) return result;

  revalidateLogoPaths();
  return { success: true };
}

export async function updateInvoiceHeaderTheme(theme: "blue" | "gradient") {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  if (theme !== "blue" && theme !== "gradient") {
    return { error: "Invalid theme" };
  }

  const result = await ensureProfileUpdate(user.id, {
    invoice_header_theme: theme as InvoiceHeaderTheme,
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
