export function getSiteUrlFromEnv(siteUrl?: string): URL | undefined {
  const value = siteUrl?.trim();
  if (!value) return undefined;

  try {
    return new URL(value.endsWith("/") ? value : `${value}/`);
  } catch {
    return undefined;
  }
}

export function resolveSiteUrl(
  astroSite: URL | undefined,
  publicSiteUrl?: string,
): URL | undefined {
  return astroSite ?? getSiteUrlFromEnv(publicSiteUrl);
}

export function getSiteOrigin(publicSiteUrl?: string): string | undefined {
  return getSiteUrlFromEnv(publicSiteUrl)?.origin;
}

export function absoluteSiteUrl(site: URL | undefined, path: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!site) return undefined;
  return new URL(path, site).toString();
}
