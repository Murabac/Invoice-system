import { M2B_LOGO_URL } from "@/lib/constants/company";

export type LogoPreset = "m2b";
export type LogoSelection = LogoPreset | "custom";

export const DEFAULT_LOGO_URL = M2B_LOGO_URL;

export function logoUrlToSelection(
  url: string | null | undefined
): LogoSelection {
  if (!url) return "m2b";
  const base = url.split("?")[0];
  if (base.endsWith(M2B_LOGO_URL)) return "m2b";
  return "custom";
}

export function logoPresetToUrl(preset: LogoPreset = "m2b"): string {
  void preset;
  return M2B_LOGO_URL;
}
