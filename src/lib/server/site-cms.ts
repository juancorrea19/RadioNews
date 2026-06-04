import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "./news-admin";
import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase";

const FLASH_TABLE = "flash_slides";
const AD_SLOTS_TABLE = "ad_slots";
const SITE_MEDIA_BUCKET = "site-media";

export type FlashSlideStatus = "draft" | "published";

export interface FlashSlideRecord {
  id: string;
  category: string;
  title: string;
  body: string;
  date_line: string;
  image_url: string | null;
  image_path: string | null;
  sort_order: number;
  status: FlashSlideStatus;
  created_at: string;
  updated_at: string;
}

export const AD_SLOT_KEYS = ["indexTop", "indexMid", "articleInline", "articleSidebar"] as const;
export type AdSlotKey = (typeof AD_SLOT_KEYS)[number];

export function isAdSlotKey(value: string): value is AdSlotKey {
  return (AD_SLOT_KEYS as readonly string[]).includes(value);
}

export interface AdSlotRecord {
  slot_key: AdSlotKey;
  label: string;
  title: string;
  description: string;
  image_url: string | null;
  image_path: string | null;
  href: string;
  alt: string;
  cta: string;
  updated_at: string;
}

function getAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  return createSupabaseAdminClient();
}

export async function uploadSiteMediaFile(
  file: File,
  subfolder: "flash" | "ads",
  currentPath?: string | null,
) {
  const supabase = getAdminClient();
  const safeName = slugify(file.name.replace(/\.[^/.]+$/, "")) || "archivo";
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : "jpg";
  const objectPath = `${subfolder}/${Date.now()}-${safeName}.${extension || "jpg"}`;

  const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw error;
  }

  if (currentPath) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([currentPath]);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(objectPath);

  return { publicUrl, path: objectPath };
}

export async function listPublishedFlashSlides() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(FLASH_TABLE)
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as FlashSlideRecord[];
}

export async function listAdminFlashSlides() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(FLASH_TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as FlashSlideRecord[];
}

export async function getAdminFlashSlideById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from(FLASH_TABLE).select("*").eq("id", id).maybeSingle();

  if (error) {
    throw error;
  }

  return data as FlashSlideRecord | null;
}

export async function getPublishedFlashSlideById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(FLASH_TABLE)
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as FlashSlideRecord | null;
}

export async function saveFlashSlide(input: {
  id?: string;
  category: string;
  title: string;
  body: string;
  dateLine: string;
  sortOrder: number;
  status: FlashSlideStatus;
  imageUrl?: string | null;
  imagePath?: string | null;
}) {
  const supabase = getAdminClient();
  const payload = {
    category: input.category.trim(),
    title: input.title.trim(),
    body: input.body.trim(),
    date_line: input.dateLine.trim(),
    sort_order: input.sortOrder,
    status: input.status,
    image_url: input.imageUrl ?? null,
    image_path: input.imagePath ?? null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from(FLASH_TABLE)
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as FlashSlideRecord;
  }

  const { data, error } = await supabase.from(FLASH_TABLE).insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return data as FlashSlideRecord;
}

export async function deleteFlashSlide(id: string) {
  const supabase = getAdminClient();
  const row = await getAdminFlashSlideById(id);

  if (!row) {
    return;
  }

  if (row.image_path) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([row.image_path]);
  }

  const { error } = await supabase.from(FLASH_TABLE).delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function listAdSlotRows(): Promise<AdSlotRecord[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from(AD_SLOTS_TABLE).select("*");

  if (error) {
    throw error;
  }

  return (data ?? []) as AdSlotRecord[];
}

export async function getAdSlotRow(slotKey: AdSlotKey): Promise<AdSlotRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from(AD_SLOTS_TABLE).select("*").eq("slot_key", slotKey).maybeSingle();

  if (error) {
    throw error;
  }

  return data as AdSlotRecord | null;
}

export async function upsertAdSlot(input: {
  slotKey: AdSlotKey;
  label: string;
  title: string;
  description: string;
  href: string;
  alt: string;
  cta: string;
  imageUrl?: string | null;
  imagePath?: string | null;
}) {
  const supabase = getAdminClient();
  const payload = {
    slot_key: input.slotKey,
    label: input.label.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    href: input.href.trim(),
    alt: input.alt.trim(),
    cta: input.cta.trim(),
    image_url: input.imageUrl ?? null,
    image_path: input.imagePath ?? null,
  };

  const { data, error } = await supabase.from(AD_SLOTS_TABLE).upsert(payload, { onConflict: "slot_key" }).select("*").single();

  if (error) {
    throw error;
  }

  return data as AdSlotRecord;
}

export async function deleteAdSlot(slotKey: AdSlotKey) {
  const supabase = getAdminClient();
  const row = await getAdSlotRow(slotKey);

  if (!row) {
    return;
  }

  if (row.image_path) {
    await supabase.storage.from(SITE_MEDIA_BUCKET).remove([row.image_path]);
  }

  const { error } = await supabase.from(AD_SLOTS_TABLE).delete().eq("slot_key", slotKey);

  if (error) {
    throw error;
  }
}
