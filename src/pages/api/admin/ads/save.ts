import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { isAdSlotKey, removeSiteMediaPath, upsertAdSlot } from "../../../../lib/server/site-cms";
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
    const imageUrl = String(formData.get("existingImageUrl") || "").trim() || null;
    const imagePath = String(formData.get("existingImagePath") || "").trim() || null;
    const obsoleteImagePath = String(formData.get("obsoleteImagePath") || "").trim();

    if (!isAdSlotKey(slotKey)) {
      return redirect("/admin/publicidad?error=slot");
    }

    if (!label || !title) {
      return redirectWithError(slotKey, "Completa al menos etiqueta y titulo.");
    }

    if (obsoleteImagePath && obsoleteImagePath !== imagePath) {
      await removeSiteMediaPath(obsoleteImagePath);
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
