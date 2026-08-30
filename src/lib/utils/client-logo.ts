export const CLIENT_LOGO_PLACEHOLDER = "/client.png";

export function hasClientLogo(logoUrl?: string | null): boolean {
  if (!logoUrl?.trim()) return false;
  const normalized = logoUrl.split("?")[0];
  return normalized !== CLIENT_LOGO_PLACEHOLDER;
}
