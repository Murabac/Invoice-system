"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { updateInvoiceHeaderTheme } from "@/lib/actions/profiles";
import type { InvoiceHeaderTheme } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface InvoiceHeaderThemeSettingProps {
  initialTheme: InvoiceHeaderTheme;
}

const themes: {
  id: InvoiceHeaderTheme;
  label: string;
  description: string;
  previewClass: string;
}[] = [
  {
    id: "blue",
    label: "Technology Blue",
    description: "Solid blue headers on invoices and quotations.",
    previewClass: "bg-[#25abe3]",
  },
  {
    id: "gradient",
    label: "Green Gradient",
    description: "Teal-to-green gradient headers on invoices and quotations.",
    previewClass:
      "bg-[linear-gradient(135deg,#26a69a_0%,#4db6ac_50%,#66bb6a_100%)]",
  },
];

export function InvoiceHeaderThemeSetting({
  initialTheme,
}: InvoiceHeaderThemeSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<InvoiceHeaderTheme>(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSelect(nextTheme: InvoiceHeaderTheme) {
    if (nextTheme === theme || isPending) return;

    setTheme(nextTheme);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateInvoiceHeaderTheme(nextTheme);
      if (result.error) {
        setError(result.error);
        setTheme(initialTheme);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Brand Color Theme
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Applies across the dashboard, sidebar, buttons, and invoice document headers.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {themes.map(({ id, label, description, previewClass }) => {
          const isSelected = theme === id;

          return (
            <button
              key={id}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(id)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                isPending && "opacity-70"
              )}
            >
              <div
                className={cn(
                  "mb-4 h-10 rounded-lg shadow-inner",
                  previewClass
                )}
              />
              <p className="font-medium text-gray-900">{label}</p>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
              {isSelected && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" />
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-4 inline-flex items-center gap-1 text-sm text-green-600">
          <Check className="h-4 w-4" />
          Theme saved
        </p>
      )}
    </div>
  );
}
