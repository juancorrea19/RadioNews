import type { APIRoute } from "astro";
import { getSiteOrigin } from "../lib/site-url";

export const GET: APIRoute = () => {
  const origin = getSiteOrigin(import.meta.env.PUBLIC_SITE_URL);
  const sitemapLine = origin ? `\nSitemap: ${origin}/sitemap.xml` : "";

  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/${sitemapLine}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
