"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

interface TermsEditorProps {
  terms: string[];
  onChange: (terms: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TermsEditor({
  terms,
  onChange,
  disabled = false,
  className,
}: TermsEditorProps) {
  function updateTerm(index: number, value: string) {
    const next = [...terms];
    next[index] = value;
    onChange(next);
  }

  function removeTerm(index: number) {
    onChange(terms.filter((_, i) => i !== index));
  }

  function addTerm() {
    onChange([...terms, ""]);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {terms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No terms added. Add a term or save to show none on documents.
        </p>
      ) : (
        terms.map((term, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2.5 w-6 shrink-0 text-sm font-medium text-gray-400">
              {index + 1}.
            </span>
            <Input
              value={term}
              onChange={(e) => updateTerm(index, e.target.value)}
              placeholder={`Term ${index + 1}`}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => removeTerm(index)}
              className="mt-0.5 shrink-0 text-gray-400 hover:text-red-600"
              aria-label={`Remove term ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={addTerm}
      >
        <Plus className="h-4 w-4" />
        Add term
      </Button>
    </div>
  );
}
