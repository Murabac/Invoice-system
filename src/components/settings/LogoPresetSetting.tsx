"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ImageIcon, Loader2, Upload } from "lucide-react";
import {
  LOGO_PRESETS,
  logoUrlToSelection,
  type LogoPreset,
  type LogoSelection,
} from "@/lib/constants/logos";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface LogoPresetSettingProps {
  title: string;
  description: string;
  logoUrl: string | null | undefined;
  updateAction: (
    preset: LogoPreset
  ) => Promise<{ error?: string; success?: boolean }>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ error?: string; success?: boolean; url?: string }>;
}

const presetOrder: LogoPreset[] = ["biloop", "alternate", "h24"];

export function LogoPresetSetting({
  title,
  description,
  logoUrl,
  updateAction,
  uploadAction,
}: LogoPresetSettingProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useState<LogoSelection>(() =>
    logoUrlToSelection(logoUrl)
  );
  const [previewUrl, setPreviewUrl] = useState(logoUrl ?? "/logo.jpeg");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelection(logoUrlToSelection(logoUrl));
    setPreviewUrl(logoUrl ?? "/logo.jpeg");
  }, [logoUrl]);

  function handleSelect(nextPreset: LogoPreset) {
    if (nextPreset === selection || isPending) return;

    setSelection(nextPreset);
    setPreviewUrl(LOGO_PRESETS[nextPreset].url);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateAction(nextPreset);
      if (result.error) {
        setError(result.error);
        setSelection(logoUrlToSelection(logoUrl));
        setPreviewUrl(logoUrl ?? "/logo.jpeg");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || isPending) return;

    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        setSelection("custom");
        setPreviewUrl(result.url);
      }
      setSaved(true);
      router.refresh();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  const isCustom = selection === "custom";
  const customPreviewClass =
    previewUrl.includes("logo-h24") && !previewUrl.startsWith("http")
      ? "bg-black"
      : "bg-white";

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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {presetOrder.map((id) => {
          const {
            label,
            description: presetDescription,
            url,
            previewClass,
          } = LOGO_PRESETS[id];
          const isSelected = selection === id;

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
                  "mb-4 flex h-20 items-center justify-center rounded-lg border border-gray-200 p-3 shadow-inner",
                  previewClass ?? "bg-white"
                )}
              >
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

      <div
        className={cn(
          "mt-4 rounded-xl border-2 p-4 transition-all",
          isCustom
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-gray-200"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex h-24 w-full shrink-0 items-center justify-center rounded-lg border border-gray-200 p-3 shadow-inner sm:h-20 sm:w-48",
              customPreviewClass
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Current logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Custom Upload</p>
            <p className="mt-1 text-sm text-gray-500">
              Upload your own logo image. JPEG, PNG, WebP or GIF · max 5 MB.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              disabled={isPending}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className="mt-3"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isPending ? "Uploading…" : "Upload Logo"}
            </Button>
            {isCustom && (
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <Check className="h-3.5 w-3.5" />
                Selected
              </span>
            )}
          </div>
        </div>
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
