"use client";

import {
  FileText,
  LayoutDashboard,
  List,
  LogOut,
  PlusCircle,
  Settings,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { canAccessSettings, isSuperAdmin } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { NavDropdown } from "./NavDropdown";
import { NavLink } from "./NavLink";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/documents",
    label: "Documents",
    icon: FileText,
    matchPrefix: true,
    excludePaths: ["/documents/new"],
  },
  {
    href: "/documents/new",
    label: "New Document",
    icon: PlusCircle,
  },
];

const clientNavItems = [
  { href: "/clients", label: "Clients List", icon: List },
  { href: "/clients/new", label: "Add Client", icon: UserPlus },
];

interface SidebarProps {
  dashboardLogoUrl?: string | null;
  dashboardHeaderText?: string | null;
  userRole?: UserRole | null;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  dashboardHeaderText,
  userRole,
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const brandName =
    dashboardHeaderText?.trim() || "Biloop Technology Innovators";
  const showSettings = canAccessSettings(userRole);
  const showUsers = isSuperAdmin(userRole);

  return (
    <aside
      className={cn(
        "no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-surface transition-transform duration-200 lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center justify-between gap-3 border-b border-gray-200 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-primary">{brandName}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Invoice System
          </p>
        </div>
        <button
          type="button"
          aria-label="Close menu"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          onClick={onNavigate}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ href, label, icon, matchPrefix, excludePaths }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            matchPrefix={matchPrefix}
            excludePaths={excludePaths}
            onNavigate={onNavigate}
          />
        ))}

        <NavDropdown
          label="Clients"
          icon={Users}
          basePath="/clients"
          items={clientNavItems}
          onNavigate={onNavigate}
        />

        {showUsers && (
          <NavLink
            href="/users"
            label="Users"
            icon={UserCog}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <div className="space-y-1 border-t border-gray-200 p-4">
        {showSettings && (
          <NavLink
            href="/settings"
            label="Settings"
            icon={Settings}
            onNavigate={onNavigate}
          />
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
