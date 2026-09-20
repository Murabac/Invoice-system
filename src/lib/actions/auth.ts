"use server";

import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getProfile } from "@/lib/actions/profiles";
import { getAuthUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";

function isQuickSuperAdminLoginEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    Boolean(
      process.env.SUPER_ADMIN_DEV_EMAIL?.trim() &&
        process.env.SUPER_ADMIN_DEV_PASSWORD
    )
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  return getAuthUser();
}

export async function quickSignInAsSuperAdmin() {
  if (!isQuickSuperAdminLoginEnabled()) {
    return { error: "Quick super admin sign-in is not enabled." };
  }

  const email = process.env.SUPER_ADMIN_DEV_EMAIL!.trim();
  const password = process.env.SUPER_ADMIN_DEV_PASSWORD!;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const profile = await getProfile();
  if (!profile || !isSuperAdmin(profile.role)) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not a super admin. Check SUPER_ADMIN_DEV_EMAIL in .env.local.",
    };
  }

  redirect("/dashboard");
}

export async function isQuickSuperAdminLoginAvailable() {
  return isQuickSuperAdminLoginEnabled();
}
