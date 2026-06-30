import { Bell, Receipt } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="no-print border-b border-gray-200 bg-surface px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden rounded-lg bg-primary/10 p-2.5 sm:block">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
