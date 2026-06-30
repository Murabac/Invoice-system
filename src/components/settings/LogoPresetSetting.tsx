"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, ImageIcon } from "lucide-react";
import {
  LOGO_PRESETS,
  logoUrlToPreset,
  type LogoPreset,
} from "@/lib/constants/logos";
import { cn } from "@/lib/utils/cn";

interface LogoPresetSettingProps {
  title: string;
  description: string;
  logoUrl: string | null | undefined;
  updateAction: (
    preset: LogoPreset
  ) => Promise<{ error?: string; success?: boolean }>;
}

const presetOrder: LogoPreset[] = ["biloop", "alternate"];

export function LogoPresetSetting({
  title,
  description,
  logoUrl,
  updateAction,
}: LogoPresetSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [preset, setPreset] = useState<LogoPreset>(() =>
    logoUrlToPreset(logoUrl)
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreset(logoUrlToPreset(logoUrl));
  }, [logoUrl]);

  function handleSelect(nextPreset: LogoPreset) {
    if (nextPreset === preset || isPending) return;

    setPreset(nextPreset);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateAction(nextPreset);
      if (result.error) {
        setError(result.error);
        setPreset(logoUrlToPreset(logoUrl));
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
          <ImageIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {presetOrder.map((id) => {
          const { label, description: presetDescription, url } = LOGO_PRESETS[id];
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
              <div className="mb-4 flex h-20 items-center justify-center rounded-lg border border-gray-200 bg-white p-3 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={label}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="font-medium text-gray-900">{label}</p>
              <p className="mt-1 text-sm text-gray-500">{presetDescription}</p>
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
          Logo saved
        </p>
      )}
    </div>
  );
}
