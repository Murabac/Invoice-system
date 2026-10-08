import { M2B_STAMP_URL } from "@/lib/constants/company";
import type { InvoiceStampPreset } from "@/lib/types/database";

export const STAMP_PRESETS: Record<
  InvoiceStampPreset,
  { label: string; description: string; url: string }
> = {
  m2b: {
    label: "M2B Technology",
    description: "M2B Technology official stamp.",
    url: M2B_STAMP_URL,
  },
};

export function getStampUrl(
  preset: InvoiceStampPreset | string | null | undefined
): string {
  if (preset === "m2b") return STAMP_PRESETS.m2b.url;
  return STAMP_PRESETS.m2b.url;
}
