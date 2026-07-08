"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { InvoiceHeaderTheme, UserRole } from "@/lib/types/database";

interface AppShellProps {
  children: React.ReactNode;
  dashboardLogoUrl?: string | null;
  dashboardHeaderText?: string | null;
  brandTheme?: InvoiceHeaderTheme;
  userRole?: UserRole | null;
}

export function AppShell({
  children,
  dashboardLogoUrl,
  dashboardHeaderText,
  brandTheme = "blue",
  userRole,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" data-brand-theme={brandTheme}>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="no-print fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        dashboardLogoUrl={dashboardLogoUrl}
        dashboardHeaderText={dashboardHeaderText}
        userRole={userRole}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print flex h-14 items-center gap-3 border-b border-gray-200 bg-surface px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-semibold text-gray-900">
            {dashboardHeaderText?.trim() || "Biloop Technology Innovators"}
          </p>
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
