import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { flashArticleHref } from "../lib/site-content";
import { getSiteOrigin } from "../lib/site-url";
import { listPublishedNewsForListing } from "../lib/server/news-admin";
import { listPublishedFlashSlides } from "../lib/server/site-cms";
import { isSupabaseConfigured } from "../lib/server/supabase";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

const STATIC_PATHS = ["/", "/quienes-somos/", "/politicas/"];

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
        : "";

      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function toLastmod(value?: string | Date): string | undefined {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
}

async function getNewsEntries(origin: string): Promise<SitemapEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      const records = await listPublishedNewsForListing();
      return records.map((record) => ({
        loc: new URL(`/noticia/${record.category}/${record.slug}/`, origin).href,
        lastmod: toLastmod(record.updated_at ?? record.published_at),
      }));
    } catch (error) {
      console.error("No se pudo generar el sitemap de noticias desde Supabase.", error);
    }
  }

  const entries = await getCollection("news", ({ data }) => data.status === "published");

  return entries.map((entry) => ({
    loc: new URL(`/noticia/${entry.data.category}/${entry.id}/`, origin).href,
    lastmod: toLastmod(entry.data.publishedAt),
  }));
}

async function getFlashEntries(origin: string): Promise<SitemapEntry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const slides = await listPublishedFlashSlides();

    return slides
      .filter((slide) => Boolean(slide.image_url?.trim()))
      .map((slide) => ({
        loc: new URL(flashArticleHref(slide.id), origin).href,
        lastmod: toLastmod(slide.updated_at ?? slide.created_at),
      }));
  } catch (error) {
    console.error("No se pudo generar el sitemap de flash desde Supabase.", error);
    return [];
  }
}

export const GET: APIRoute = async () => {
  const origin = getSiteOrigin(import.meta.env.PUBLIC_SITE_URL);

  if (!origin) {
    return new Response("PUBLIC_SITE_URL no esta configurada.", { status: 503 });
  }

  const staticEntries: SitemapEntry[] = STATIC_PATHS.map((path) => ({
    loc: new URL(path, origin).href,
  }));

  const [newsEntries, flashEntries] = await Promise.all([
    getNewsEntries(origin),
    getFlashEntries(origin),
  ]);

  const xml = buildSitemapXml([...staticEntries, ...newsEntries, ...flashEntries]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
