"use server";

import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getProfile } from "@/lib/actions/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabase } from "@/lib/supabase/get-user";

export type UserListItem = {
  id: string;
  email: string | null;
  company_name: string | null;
  role: "super_admin" | "admin";
  created_at: string;
};

async function requireSuperAdmin() {
  const profile = await getProfile();
  if (!profile || !isSuperAdmin(profile.role)) {
    return { error: "Unauthorized" as const, profile: null };
  }
  return { profile, error: null };
}

export async function listUsers(): Promise<UserListItem[]> {
  const check = await requireSuperAdmin();
  if (check.error) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, company_name, role, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []) as UserListItem[];
}

export async function createAdminUser(data: {
  email: string;
  password: string;
  company_name?: string;
}) {
  const check = await requireSuperAdmin();
  if (check.error) return { error: check.error };

  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const company_name = data.company_name?.trim() || "Biloop Technology Innovators";

  if (!email) return { error: "Email is required" };
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Server is not configured for user management",
    };
  }

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name,
        role: "admin",
      },
    });

  if (createError) return { error: createError.message };
  if (!created.user) return { error: "Failed to create user" };

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      email,
      company_name,
      role: "admin",
    })
    .eq("id", created.user.id);

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteAdminUser(userId: string) {
  const check = await requireSuperAdmin();
  if (check.error) return { error: check.error };

  if (check.profile?.id === userId) {
    return { error: "You cannot delete your own account" };
  }

  const supabase = await getSupabase();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (target?.role === "super_admin") {
    return { error: "The super admin account cannot be deleted" };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Server is not configured for user management",
    };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/users");
  return { success: true };
}
