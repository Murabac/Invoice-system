"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Stamp } from "lucide-react";
import { updateInvoiceStampPreset } from "@/lib/actions/profiles";
import { STAMP_PRESET_ORDER, STAMP_PRESETS } from "@/lib/constants/stamps";
import type { InvoiceStampPreset } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

interface StampPresetSettingProps {
  initialPreset: InvoiceStampPreset;
}

export function StampPresetSetting({ initialPreset }: StampPresetSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preset, setPreset] = useState<InvoiceStampPreset>(initialPreset);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSelect(nextPreset: InvoiceStampPreset) {
    if (nextPreset === preset || isPending) return;

    setPreset(nextPreset);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateInvoiceStampPreset(nextPreset);
      if (result.error) {
        setError(result.error);
        setPreset(initialPreset);
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
          <Stamp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Official Stamp</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose which stamp appears on invoices when the official stamp overlay is enabled.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {STAMP_PRESET_ORDER.map((id) => {
          const { label, description, url } = STAMP_PRESETS[id];
          const isSelected = preset === id;

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
              <div className="mb-4 flex h-28 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={label}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
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
          Stamp saved
        </p>
      )}
    </div>
  );
}
