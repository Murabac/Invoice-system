"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Type } from "lucide-react";
import { updateDashboardHeaderText } from "@/lib/actions/profiles";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DashboardHeaderSettingProps {
  initialText: string;
}

export function DashboardHeaderSetting({ initialText }: DashboardHeaderSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateDashboardHeaderText(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Type className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Dashboard Header Text
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Shown next to your logo in the sidebar navigation.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Input
          label="Header text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          placeholder="Biloop Technology Innovators"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Header Text"}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
