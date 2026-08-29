export type LogoPreset = "biloop" | "alternate" | "h24" | "m2b";
export type LogoSelection = LogoPreset | "custom";

export const LOGO_PRESETS: Record<
  LogoPreset,
  { label: string; description: string; url: string; previewClass?: string }
> = {
  biloop: {
    label: "Biloop",
    description: "Primary Biloop logo (JPEG).",
    url: "/logo.jpeg",
  },
  alternate: {
    label: "Biloop Alternate",
    description: "Secondary Biloop logo variant (PNG).",
    url: "/logo.png",
  },
  h24: {
    label: "H24 Technology",
    description: "H24 Technology logo.",
    url: "/logo-h24.png",
    previewClass: "bg-black",
  },
  m2b: {
    label: "M2B Technology",
    description: "M2B Technology logo.",
    url: "/logo-m2b.png",
  },
};

export function logoUrlToSelection(
  url: string | null | undefined
): LogoSelection {
  if (!url) return "biloop";

  const base = url.split("?")[0];
  for (const preset of Object.keys(LOGO_PRESETS) as LogoPreset[]) {
    if (base.endsWith(LOGO_PRESETS[preset].url)) {
      return preset;
    }
  }

  return "custom";
}

export function logoPresetToUrl(preset: LogoPreset): string {
  return LOGO_PRESETS[preset].url;
}
