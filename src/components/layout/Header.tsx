import type { LucideIcon } from "lucide-react";
import { Bell, Receipt } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function Header({
  title,
  description,
  icon: Icon = Receipt,
  actions,
}: HeaderProps) {
  return (
    <header className="no-print border-b border-gray-200 bg-surface px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="hidden shrink-0 rounded-lg bg-primary/10 p-2.5 sm:block">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm leading-snug text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {actions}
          <button
            type="button"
            className="hidden rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 sm:block"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
