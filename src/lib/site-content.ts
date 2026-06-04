import { adSlots as defaultAdSlots, type AdSlotConfig } from "../data/ads";
import { AD_SLOT_KEYS, listAdSlotRows, listPublishedFlashSlides, type AdSlotKey } from "./server/site-cms";
import { isSupabaseConfigured } from "./server/supabase";

export interface FlashCarouselSlide {
  id: string;
  href: string;
  categoria: string;
  titulo: string;
  texto: string;
  fechaLinea: string;
  imagenUrl: string;
  imagenAlt: string;
}

export function flashArticleHref(id: string) {
  return `/flash/${id}/`;
}

export type ResolvedAdSlots = Record<AdSlotKey, AdSlotConfig>;

export async function getFlashCarouselSlides(): Promise<FlashCarouselSlide[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const rows = await listPublishedFlashSlides();
    return rows
      .filter((r) => Boolean(r.image_url?.trim()))
      .map((r) => ({
        id: r.id,
        href: flashArticleHref(r.id),
        categoria: r.category,
        titulo: r.title,
        texto: r.body,
        fechaLinea: r.date_line,
        imagenUrl: r.image_url as string,
        imagenAlt: r.title,
      }));
  } catch (error) {
    console.error("No se pudieron cargar las diapositivas de flash desde Supabase.", error);
    return [];
  }
}

export async function getResolvedAdSlots(): Promise<ResolvedAdSlots> {
  const base: ResolvedAdSlots = {
    indexTop: { ...defaultAdSlots.indexTop },
    indexMid: { ...defaultAdSlots.indexMid },
    articleInline: { ...defaultAdSlots.articleInline },
    articleSidebar: { ...defaultAdSlots.articleSidebar },
  };

  if (!isSupabaseConfigured()) {
    return base;
  }

  try {
    const rows = await listAdSlotRows();
    for (const row of rows) {
      if (!(AD_SLOT_KEYS as readonly string[]).includes(row.slot_key)) {
        continue;
      }
      const key = row.slot_key as AdSlotKey;
      const previous = base[key];
      const pick = (v: string | null | undefined, fallback: string) => {
        const t = v?.trim();
        return t !== undefined && t !== "" ? t : fallback;
      };
      base[key] = {
        label: pick(row.label, previous.label),
        title: pick(row.title, previous.title),
        description: pick(row.description, previous.description),
        imageSrc: pick(row.image_url ?? undefined, previous.imageSrc ?? ""),
        href: pick(row.href, previous.href ?? ""),
        alt: pick(row.alt, previous.alt ?? ""),
        cta: pick(row.cta, previous.cta ?? ""),
      };
    }
  } catch (error) {
    console.error("No se pudieron cargar los banners desde Supabase.", error);
  }

  return base;
}
