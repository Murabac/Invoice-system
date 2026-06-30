"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavDropdownItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavDropdownProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  basePath: string;
  items: NavDropdownItem[];
}

export function NavDropdown({
  label,
  icon: Icon,
  basePath,
  items,
}: NavDropdownProps) {
  const pathname = usePathname();
  const isSectionActive = pathname.startsWith(basePath);
  const [open, setOpen] = useState(isSectionActive);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (isSectionActive) {
      setOpen(true);
    }
  }, [isSectionActive]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isSectionActive
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
        aria-expanded={open}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-0.5 pl-3">
            {items.map(({ href, label: itemLabel, icon: ItemIcon }) => {
              const isActive = pathname === href;
              const isPending = pendingHref === href && !isActive;

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  onClick={() => setPendingHref(href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 pl-6 pr-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    isPending && "opacity-70"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <ItemIcon className="h-4 w-4 shrink-0" />
                  )}
                  {itemLabel}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
