import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { createSignedMediaUpload } from "../../../../lib/server/signed-upload";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";
import { isAdminUploadPurpose } from "../../../../lib/upload-limits";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (!isSupabaseConfigured()) {
      return json({ message: "Supabase no esta configurado." }, 503);
    }

    const admin = await getAuthenticatedAdmin(cookies);
    if (!admin.user) {
      return json({ message: "No autorizado." }, 401);
    }

    const body = (await request.json()) as {
      purpose?: string;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
    };

    const purpose = String(body.purpose || "").trim();
    const filename = String(body.filename || "").trim();
    const contentType = String(body.contentType || "").trim();
    const sizeBytes = Number(body.sizeBytes);

    if (!isAdminUploadPurpose(purpose)) {
      return json({ message: "Tipo de subida no valido." }, 400);
    }

    const result = await createSignedMediaUpload({
      purpose,
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
    console.error("Error firmando subida admin", error);
    return json({ message: "No se pudo preparar la subida." }, 500);
  }
};
