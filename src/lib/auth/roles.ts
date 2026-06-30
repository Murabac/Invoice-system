import type { UserRole } from "@/lib/types/database";

export function canAccessSettings(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export function roleLabel(role: UserRole): string {
  return role === "super_admin" ? "Super Admin" : "Admin";
}
