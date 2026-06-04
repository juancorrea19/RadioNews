import { getCollection, type CollectionEntry } from "astro:content";
import {
  allNews as fallbackAllNews,
  type CategoryData,
  type NewsItem,
} from "../data/news";
import {
  NEWS_CATEGORY_META,
  NEWS_CATEGORY_ORDER,
  type NewsCategorySlug,
} from "./news-categories";
import { listPublishedNews, type NewsArticleRecord } from "./server/news-admin";
import { isSupabaseConfigured } from "./server/supabase";

export interface ResolvedNewsItem extends NewsItem {
  author?: string;
  publishedAt?: Date;
  entry?: CollectionEntry<"news">;
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();

  if (diffMs <= 0) return "Ahora";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}sem`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mes`;

  const years = Math.floor(days / 365);
  return `${years}a`;
}

function splitContent(body: string, fallbackExcerpt?: string): string[] {
  const normalized = body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (normalized.length > 0) return normalized;
  if (fallbackExcerpt) return [fallbackExcerpt];

  return ["Esta noticia aun no tiene contenido cargado."];
}

function uniqueByHeadline(items: ResolvedNewsItem[]): ResolvedNewsItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.categorySlug}:${item.headline}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

async function getCmsNews(): Promise<ResolvedNewsItem[]> {
  const entries = await getCollection("news", ({ data }) => data.status === "published");

  return entries
    .map((entry) => {
      const categorySlug = entry.data.category as NewsCategorySlug;
      const meta = NEWS_CATEGORY_META[categorySlug];

      return {
        id: entry.id,
        slug: entry.id,
        href: `/noticia/${categorySlug}/${entry.id}/`,
        image: entry.data.coverImage,
        category: meta.title,
        categorySlug,
        timeAgo: formatTimeAgo(entry.data.publishedAt),
        headline: entry.data.title,
        excerpt: entry.data.excerpt,
        content: splitContent(entry.body ?? "", entry.data.excerpt || ""),
        author: entry.data.author,
        publishedAt: entry.data.publishedAt,
        entry,
      };
    })
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

const VIDEO_CARD_PLACEHOLDER = "/favicon.png";

function mapSupabaseNews(record: NewsArticleRecord): ResolvedNewsItem {
  const categorySlug = record.category as NewsCategorySlug;
  const meta = NEWS_CATEGORY_META[categorySlug];
  const publishedAt = new Date(record.published_at);
  const isVideo = Boolean(record.cover_video_url?.trim());
  const cardImage =
    record.cover_image_url ?? (isVideo ? VIDEO_CARD_PLACEHOLDER : "/favicon.png");

  return {
    id: record.id,
    slug: record.slug,
    href: `/noticia/${categorySlug}/${record.slug}/`,
    image: cardImage,
    coverMediaType: isVideo ? "video" : "image",
    videoUrl: isVideo ? (record.cover_video_url ?? undefined) : undefined,
    category: meta.title,
    categorySlug,
    timeAgo: formatTimeAgo(publishedAt),
    headline: record.title,
    excerpt: record.excerpt ?? undefined,
    content: splitContent(record.body, record.excerpt ?? undefined),
    author: record.author ?? "Redaccion Radio News Online",
    publishedAt,
  };
}

async function getSupabaseNews(): Promise<ResolvedNewsItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const records = await listPublishedNews();
    return records.map(mapSupabaseNews);
  } catch (error) {
    console.error("No se pudieron cargar las noticias desde Supabase.", error);
    return [];
  }
}

export async function getAllNews(): Promise<ResolvedNewsItem[]> {
  const supabaseNews = await getSupabaseNews();

  if (supabaseNews.length > 0) {
    return supabaseNews;
  }

  const cmsNews = await getCmsNews();

  if (cmsNews.length > 0) {
    return [...cmsNews, ...fallbackAllNews];
  }

  return fallbackAllNews;
}

export async function getCategoriesData(): Promise<CategoryData[]> {
  const allNews = await getAllNews();

  return NEWS_CATEGORY_ORDER
    .map((slug) => ({
      title: NEWS_CATEGORY_META[slug].title,
      slug,
      accentColor: NEWS_CATEGORY_META[slug].accentColor,
      news: allNews.filter((item) => item.categorySlug === slug),
    }))
    .filter((category) => category.news.length > 0);
}

export async function findNewsItem(categorySlug: string, articleSlug: string): Promise<ResolvedNewsItem | undefined> {
  const allNews = await getAllNews();
  return allNews.find((item) => item.categorySlug === categorySlug && item.slug === articleSlug);
}

export async function getRelatedNews(
  categorySlug: string,
  currentSlug: string,
  limit = 4,
): Promise<ResolvedNewsItem[]> {
  const allNews = await getAllNews();

  return uniqueByHeadline(
    allNews.filter((item) => item.categorySlug === categorySlug && item.slug !== currentSlug),
  ).slice(0, limit);
}

export async function getCrossCategoryNews(
  categorySlug: string,
  currentSlug: string,
  limit = 6,
): Promise<ResolvedNewsItem[]> {
  const allNews = await getAllNews();

  return uniqueByHeadline(
    allNews.filter((item) => item.categorySlug !== categorySlug && item.slug !== currentSlug),
  ).slice(0, limit);
}
