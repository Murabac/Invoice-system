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
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { canAccessSettings, isSuperAdmin } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";
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
}

export function Sidebar({
  dashboardHeaderText,
  userRole,
}: SidebarProps) {
  const brandName =
    dashboardHeaderText?.trim() || "Biloop Technology Innovators";
  const showSettings = canAccessSettings(userRole);
  const showUsers = isSuperAdmin(userRole);

  return (
    <aside className="no-print flex w-64 shrink-0 flex-col border-r border-gray-200 bg-surface">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-primary">{brandName}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Invoice System
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon, matchPrefix, excludePaths }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            matchPrefix={matchPrefix}
            excludePaths={excludePaths}
          />
        ))}

        <NavDropdown
          label="Clients"
          icon={Users}
          basePath="/clients"
          items={clientNavItems}
        />

        {showUsers && (
          <NavLink href="/users" label="Users" icon={UserCog} />
        )}
      </nav>

      <div className="space-y-1 border-t border-gray-200 p-4">
        {showSettings && (
          <NavLink href="/settings" label="Settings" icon={Settings} />
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
