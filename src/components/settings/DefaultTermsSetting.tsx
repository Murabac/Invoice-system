"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, FileText, RotateCcw } from "lucide-react";
import { updateDefaultTerms } from "@/lib/actions/profiles";
import { DEFAULT_TERMS } from "@/lib/constants/company";
import { TermsEditor } from "@/components/terms/TermsEditor";
import { Button } from "@/components/ui/Button";

interface DefaultTermsSettingProps {
  initialTerms: string[];
}

export function DefaultTermsSetting({ initialTerms }: DefaultTermsSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [terms, setTerms] = useState<string[]>(initialTerms);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTerms(initialTerms);
  }, [initialTerms]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateDefaultTerms(terms);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleReset() {
    setTerms([...DEFAULT_TERMS]);
    setSaved(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Terms & Conditions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Default terms shown on every new invoice and quotation. You can edit or remove them per document when creating one.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TermsEditor terms={terms} onChange={setTerms} disabled={isPending} />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Terms"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </Button>
        {saved && !error && (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
