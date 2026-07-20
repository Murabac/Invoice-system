import type { InvoiceStampPreset } from "@/lib/types/database";

export const STAMP_PRESETS: Record<
  InvoiceStampPreset,
  { label: string; description: string; url: string }
> = {
  biloop: {
    label: "Biloop",
    description: "Blue circular Biloop official stamp.",
    url: "/stamp.png",
  },
  h24: {
    label: "H24 Technology",
    description: "Sky-blue H24 Technology official stamp.",
    url: "/stamp-h24.png",
  },
};

export const STAMP_PRESET_ORDER: InvoiceStampPreset[] = ["biloop", "h24"];

export function getStampUrl(
  preset: InvoiceStampPreset | null | undefined
): string {
  return STAMP_PRESETS[preset ?? "biloop"].url;
}
