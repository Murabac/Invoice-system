export type LogoPreset = "biloop" | "alternate";

export const LOGO_PRESETS: Record<
  LogoPreset,
  { label: string; description: string; url: string }
> = {
  biloop: {
    label: "Primary Logo",
    description: "Default Biloop logo (JPEG).",
    url: "/logo.jpeg",
  },
  alternate: {
    label: "Alternate Logo",
    description: "Secondary logo variant (PNG).",
    url: "/logo.png",
  },
};

export function logoUrlToPreset(url: string | null | undefined): LogoPreset {
  if (url?.includes("logo.png")) return "alternate";
  return "biloop";
}

export function logoPresetToUrl(preset: LogoPreset): string {
  return LOGO_PRESETS[preset].url;
}
