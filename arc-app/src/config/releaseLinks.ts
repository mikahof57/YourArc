export type ArcReleaseLinkKey = 'privacy' | 'support' | 'terms' | 'imprint';

function configuredHttpsUrl(value: string | undefined): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : null; } catch { return null; }
}

export const ARC_RELEASE_LINKS: Readonly<Record<ArcReleaseLinkKey, string | null>> = Object.freeze({
  privacy: configuredHttpsUrl(import.meta.env.VITE_ARC_PRIVACY_POLICY_URL),
  support: configuredHttpsUrl(import.meta.env.VITE_ARC_SUPPORT_URL),
  terms: configuredHttpsUrl(import.meta.env.VITE_ARC_TERMS_URL),
  imprint: configuredHttpsUrl(import.meta.env.VITE_ARC_IMPRINT_URL),
});

export const missingRequiredReleaseLinks = () => (['privacy', 'support', 'terms'] as const)
  .filter((key) => ARC_RELEASE_LINKS[key] === null);
