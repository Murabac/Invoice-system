import type { UserRole } from "@/lib/types/database";

export function canAccessDashboard(
  role: UserRole | null | undefined
): boolean {
  return role === "super_admin" || role === "admin";
}

export function canAccessSettings(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
  return role === "super_admin";
}

export function roleLabel(role: UserRole): string {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Pending";
}
