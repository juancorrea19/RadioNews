import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { isAdSlotKey, upsertAdSlot, uploadSiteMediaFile } from "../../../../lib/server/site-cms";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const redirectWithError = (slotKey: string, message: string) =>
    redirect(`/admin/publicidad?slot=${encodeURIComponent(slotKey)}&error=${encodeURIComponent(message)}`);

  try {
    if (!isSupabaseConfigured()) {
      return redirect("/admin/login?error=config");
    }

    const admin = await getAuthenticatedAdmin(cookies);

    if (!admin.user) {
      return redirect("/admin/login");
    }

    const formData = await request.formData();
    const slotKey = String(formData.get("slotKey") || "").trim();
    const label = String(formData.get("label") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const href = String(formData.get("href") || "").trim();
    const alt = String(formData.get("alt") || "").trim();
    const cta = String(formData.get("cta") || "").trim();
    const existingImageUrl = String(formData.get("existingImageUrl") || "").trim();
    const existingImagePath = String(formData.get("existingImagePath") || "").trim();
    const image = formData.get("image");

    if (!isAdSlotKey(slotKey)) {
      return redirect("/admin/publicidad?error=slot");
    }

    if (!label || !title) {
      return redirectWithError(slotKey, "Completa al menos etiqueta y titulo.");
    }

    let imageUrl = existingImageUrl || null;
    let imagePath = existingImagePath || null;

    if (image instanceof File && image.size > 0) {
      if (image.size > 6 * 1024 * 1024) {
        return redirectWithError(slotKey, "La imagen supera el limite de 6 MB.");
      }

      const uploaded = await uploadSiteMediaFile(image, "ads", imagePath);
      imageUrl = uploaded.publicUrl;
      imagePath = uploaded.path;
    }

    await upsertAdSlot({
      slotKey,
      label,
      title,
      description,
      href,
      alt,
      cta,
      imageUrl,
      imagePath,
    });

    return redirect(`/admin/publicidad?slot=${encodeURIComponent(slotKey)}&saved=1`);
  } catch (error) {
    console.error("Error guardando banner publicitario", error);
    return redirect("/admin/publicidad?error=save");
  }
};
