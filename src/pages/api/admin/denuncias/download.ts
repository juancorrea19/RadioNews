import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { createEvidenceSignedUrl, getDenunciaById } from "../../../../lib/server/denuncias";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";

export const GET: APIRoute = async ({ url, cookies }) => {
  if (!isSupabaseConfigured()) {
    return new Response("Supabase no configurado", { status: 503 });
  }

  const session = await getAuthenticatedAdmin(cookies);

  if (!session.user) {
    return new Response("No autorizado", { status: 401 });
  }

  const id = new URL(url).searchParams.get("id")?.trim();

  if (!id) {
    return new Response("Falta id", { status: 400 });
  }

  const row = await getDenunciaById(id);

  if (!row?.evidence_path) {
    return new Response("Sin evidencia", { status: 404 });
  }

  try {
    const signedUrl = await createEvidenceSignedUrl(row.evidence_path, 120);
    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error("Error generando URL firmada de evidencia", error);
    return new Response("No se pudo generar el enlace de descarga", { status: 500 });
  }
};
