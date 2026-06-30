"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavLinkProps {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  matchPrefix?: boolean;
  /** Paths that must not activate this link even when the prefix matches */
  excludePaths?: string[];
}

export function NavLink({
  href,
  label,
  icon: Icon,
  matchPrefix,
  excludePaths,
}: NavLinkProps) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  const isExcluded = excludePaths?.some((path) => pathname.startsWith(path));

  const isActive =
    !isExcluded &&
    (pathname === href ||
      (matchPrefix &&
        href !== "/dashboard" &&
        pathname.startsWith(href) &&
        (pathname.length === href.length || pathname[href.length] === "/")));

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={() => setPending(true)}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        pending && !isActive && "opacity-70"
      )}
    >
      {pending && !isActive ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {label}
    </Link>
  );
}
