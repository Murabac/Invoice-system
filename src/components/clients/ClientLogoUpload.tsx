"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { uploadClientLogo } from "@/lib/actions/clients";
import { Button } from "@/components/ui/Button";

interface ClientLogoUploadProps {
  clientId: string;
  clientName: string;
  logoUrl: string | null;
  onLogoUpdated: (url: string) => void;
}

export function ClientLogoUpload({
  clientId,
  clientName,
  logoUrl,
  onLogoUpdated,
}: ClientLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const displayUrl = logoUrl || "/client.png";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadClientLogo(clientId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        onLogoUpdated(result.url);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-surface-muted/40 p-4">
      <p className="mb-2 text-sm font-medium text-gray-700">Client Logo</p>
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-32 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white">
          <Image
            src={displayUrl}
            alt={`${clientName} logo`}
            fill
            className="object-contain p-1"
            unoptimized={displayUrl.startsWith("http")}
          />
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={isPending}
            className="hidden"
            id={`client-logo-${clientId}`}
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
            {isPending ? "Uploading…" : "Upload Logo"}
          </Button>
          <p className="mt-1.5 text-xs text-gray-500">
            JPEG, PNG, WebP or GIF · max 5 MB
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
