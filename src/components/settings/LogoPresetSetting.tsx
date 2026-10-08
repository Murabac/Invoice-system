"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ImageIcon, Loader2, Upload } from "lucide-react";
import {
  DEFAULT_LOGO_URL,
  logoUrlToSelection,
  type LogoPreset,
} from "@/lib/constants/logos";
import { Button } from "@/components/ui/Button";

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
  const [previewUrl, setPreviewUrl] = useState(logoUrl ?? DEFAULT_LOGO_URL);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isDefault = logoUrlToSelection(logoUrl) === "m2b";

  useEffect(() => {
    setPreviewUrl(logoUrl ?? DEFAULT_LOGO_URL);
  }, [logoUrl]);

  function handleResetDefault() {
    if (isPending) return;
    setError(null);
    setSaved(false);
    setPreviewUrl(DEFAULT_LOGO_URL);

    startTransition(async () => {
      const result = await updateAction("m2b");
      if (result.error) {
        setError(result.error);
        setPreviewUrl(logoUrl ?? DEFAULT_LOGO_URL);
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
        setPreviewUrl(result.url);
      }
      setSaved(true);
      router.refresh();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
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

      <div className="mt-6 rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-3 shadow-inner sm:h-20 sm:w-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Current logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
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
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isPending ? "Uploading…" : "Upload logo"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending || isDefault}
              onClick={handleResetDefault}
            >
              Use default M2B logo
            </Button>
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
