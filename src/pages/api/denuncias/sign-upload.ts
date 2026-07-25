import type { APIRoute } from "astro";
import { createSignedMediaUpload } from "../../../lib/server/signed-upload";
import { isSupabaseConfigured } from "../../../lib/server/supabase";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!isSupabaseConfigured()) {
      return json({ message: "El servicio de denuncias no esta disponible." }, 503);
    }

    const body = (await request.json()) as {
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
    };

    const filename = String(body.filename || "").trim();
    const contentType = String(body.contentType || "").trim();
    const sizeBytes = Number(body.sizeBytes);

    const result = await createSignedMediaUpload({
      purpose: "denuncia-evidence",
      filename,
      contentType,
      sizeBytes,
    });

    if (!result.ok) {
      return json({ message: result.message }, 400);
    }

    return json({
      ok: true,
      bucket: result.bucket,
      path: result.path,
      publicUrl: result.publicUrl,
      token: result.token,
      signedUrl: result.signedUrl,
      contentType: result.contentType,
    });
  } catch (error) {
    console.error("Error firmando subida de evidencia", error);
    return json({ message: "No se pudo preparar la subida de evidencia." }, 500);
  }
};
