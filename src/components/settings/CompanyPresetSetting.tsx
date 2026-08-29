"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, Check } from "lucide-react";
import { applyCompanyPreset } from "@/lib/actions/profiles";
import {
  COMPANY_PRESET_ORDER,
  COMPANY_PRESETS,
  type CompanyPresetId,
} from "@/lib/constants/companies";
import { cn } from "@/lib/utils/cn";

interface CompanyPresetSettingProps {
  activePreset: CompanyPresetId | null;
}

export function CompanyPresetSetting({
  activePreset,
}: CompanyPresetSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<CompanyPresetId | null>(activePreset);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSelect(presetId: CompanyPresetId) {
    if (presetId === selected || isPending) return;

    setSelected(presetId);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await applyCompanyPreset(presetId);
      if (result.error) {
        setError(result.error);
        setSelected(activePreset);
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
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Switch company branding in one step — header text, location, contact,
            logo, colors, stamp, and default terms.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANY_PRESET_ORDER.map((id) => {
          const { label, description, logoUrl, previewClass } =
            COMPANY_PRESETS[id];
          const isSelected = selected === id;

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
                  "mb-4 flex h-24 items-center justify-center rounded-lg border border-gray-200 p-3 shadow-inner",
                  previewClass ?? "bg-white"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={label}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
              {isSelected && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Check className="h-3.5 w-3.5" />
                  Active
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
          Company profile applied
        </p>
      )}
    </div>
  );
}
