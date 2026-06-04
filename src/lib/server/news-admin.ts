import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveVideoContentType } from "../news-video";
import { NEWS_CATEGORY_META, type NewsCategorySlug } from "../news-categories";
import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase";

export type CoverMediaType = "image" | "video";

export interface NewsArticleRecord {
  id: string;
  title: string;
  slug: string;
  category: NewsCategorySlug;
  excerpt: string | null;
  author: string | null;
  body: string;
  cover_image_url: string | null;
  cover_image_path: string | null;
  cover_media_type?: CoverMediaType | null;
  cover_video_url: string | null;
  cover_video_path: string | null;
  published_at: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

export const NEWS_IMAGE_MAX_BYTES = 6 * 1024 * 1024;
export const NEWS_VIDEO_MAX_BYTES = 100 * 1024 * 1024;

const NEWS_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const NEWS_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);

export function isCoverMediaType(value: string): value is CoverMediaType {
  return value === "image" || value === "video";
}

export function isNewsVideoFile(file: File): boolean {
  if (NEWS_VIDEO_MIME_TYPES.has(file.type)) {
    return true;
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "";
  return Boolean(extension && NEWS_VIDEO_EXTENSIONS.has(extension));
}

const NEWS_TABLE = "news_articles";
const NEWS_BUCKET = "news-images";

export function isNewsCategory(value: string): value is NewsCategorySlug {
  return value in NEWS_CATEGORY_META;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDatetimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  return createSupabaseAdminClient();
}

async function ensureUniqueSlug(client: SupabaseClient, baseSlug: string, currentId?: string) {
  const fallback = baseSlug || `noticia-${Date.now()}`;

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? fallback : `${fallback}-${index + 1}`;

    let query = client.from(NEWS_TABLE).select("id").eq("slug", candidate).limit(1);

    if (currentId) {
      query = query.neq("id", currentId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return candidate;
    }
  }

  return `${fallback}-${Date.now()}`;
}

export async function listAdminNews() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(NEWS_TABLE)
    .select("*")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NewsArticleRecord[];
}

export async function getAdminNewsById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(NEWS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as NewsArticleRecord | null;
}

export async function listPublishedNews() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(NEWS_TABLE)
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NewsArticleRecord[];
}

export async function uploadNewsImage(file: File, currentPath?: string | null) {
  const supabase = getAdminClient();
  const safeName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "imagen";
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
  const objectPath = `covers/${Date.now()}-${safeName}.${extension || "jpg"}`;

  const { error } = await supabase.storage
    .from(NEWS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    throw error;
  }

  if (currentPath) {
    await supabase.storage.from(NEWS_BUCKET).remove([currentPath]);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(objectPath);

  return {
    publicUrl,
    path: objectPath,
  };
}

export async function uploadNewsVideo(file: File, currentPath?: string | null) {
  const supabase = getAdminClient();
  const safeName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "video";
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "mp4";
  const objectPath = `videos/${Date.now()}-${safeName}.${extension || "mp4"}`;
  const contentType = resolveVideoContentType(file);

  const { error } = await supabase.storage
    .from(NEWS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (error) {
    throw error;
  }

  if (currentPath) {
    await supabase.storage.from(NEWS_BUCKET).remove([currentPath]);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(NEWS_BUCKET).getPublicUrl(objectPath);

  return {
    publicUrl,
    path: objectPath,
  };
}

export async function removeNewsStoragePath(path?: string | null) {
  if (!path) {
    return;
  }

  const supabase = getAdminClient();
  await supabase.storage.from(NEWS_BUCKET).remove([path]);
}

export async function saveNewsArticle(input: {
  id?: string;
  title: string;
  category: NewsCategorySlug;
  excerpt?: string;
  author?: string;
  body: string;
  publishedAt: string;
  status: "draft" | "published";
  coverMediaType?: CoverMediaType;
  coverImageUrl?: string | null;
  coverImagePath?: string | null;
  coverVideoUrl?: string | null;
  coverVideoPath?: string | null;
}) {
  const supabase = getAdminClient();
  const slug = await ensureUniqueSlug(supabase, slugify(input.title), input.id);

  const payload = {
    title: input.title,
    slug,
    category: input.category,
    excerpt: input.excerpt?.trim() || null,
    author: input.author?.trim() || "Redaccion Radio News Online",
    body: input.body,
    published_at: input.publishedAt,
    status: input.status,
    cover_media_type: input.coverMediaType ?? "image",
    cover_image_url: input.coverImageUrl ?? null,
    cover_image_path: input.coverImagePath ?? null,
    cover_video_url: input.coverVideoUrl ?? null,
    cover_video_path: input.coverVideoPath ?? null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from(NEWS_TABLE)
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as NewsArticleRecord;
  }

  const { data, error } = await supabase.from(NEWS_TABLE).insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return data as NewsArticleRecord;
}

export async function deleteNewsArticle(id: string) {
  const supabase = getAdminClient();
  const row = await getAdminNewsById(id);

  if (!row) {
    return;
  }

  await removeNewsStoragePath(row.cover_image_path);
  await removeNewsStoragePath(row.cover_video_path);

  const { error } = await supabase.from(NEWS_TABLE).delete().eq("id", id);

  if (error) {
    throw error;
  }
}
