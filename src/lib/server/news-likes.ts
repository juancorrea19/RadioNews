import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase";

const LIKES_TABLE = "news_likes";

/** Acepta "categoria/noticia" en minusculas, numeros y guiones (mismo formato que las rutas). */
const LIKE_KEY_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/;

export function isValidLikeKey(value: unknown): value is string {
  return typeof value === "string" && value.length <= 200 && LIKE_KEY_PATTERN.test(value);
}

export async function getLikeCount(key: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(LIKES_TABLE)
      .select("count")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.count ?? 0;
  } catch (error) {
    console.error(`No se pudo leer el contador de "me gusta" (${key}).`, error);
    return 0;
  }
}

export async function getLikeCounts(keys: string[]): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || keys.length === 0) {
    return {};
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from(LIKES_TABLE).select("key, count").in("key", keys);

    if (error) {
      throw error;
    }

    return Object.fromEntries((data ?? []).map((row) => [row.key, row.count]));
  } catch (error) {
    console.error("No se pudieron leer los contadores de \"me gusta\".", error);
    return {};
  }
}

export async function adjustLikeCount(key: string, delta: 1 | -1): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no esta configurado todavia.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("adjust_news_like", {
    p_key: key,
    p_delta: delta,
  });

  if (error) {
    throw error;
  }

  return typeof data === "number" ? data : 0;
}
