import type { APIRoute } from "astro";
import { isSupabaseConfigured } from "../../lib/server/supabase";
import { adjustLikeCount, isValidLikeKey } from "../../lib/server/news-likes";

export const prerender = false;

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!isSupabaseConfigured()) {
    return response({ message: "Los me gusta no estan disponibles en este momento." }, 503);
  }

  try {
    const body = await request.json().catch(() => null);
    const key = body?.key;
    const liked = body?.liked;

    if (!isValidLikeKey(key) || typeof liked !== "boolean") {
      return response({ message: "Solicitud invalida." }, 400);
    }

    const count = await adjustLikeCount(key, liked ? 1 : -1);

    return response({ ok: true, count });
  } catch (error) {
    console.error("Error actualizando el contador de \"me gusta\".", error);
    return response({ message: "No se pudo actualizar el contador de me gusta." }, 500);
  }
};
