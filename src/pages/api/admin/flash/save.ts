import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { removeSiteMediaPath, saveFlashSlide } from "../../../../lib/server/site-cms";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const redirectWithError = (target: string, message: string) =>
    redirect(`${target}?error=${encodeURIComponent(message)}`);

  try {
    if (!isSupabaseConfigured()) {
      return redirect("/admin/login?error=config");
    }

    const admin = await getAuthenticatedAdmin(cookies);

    if (!admin.user) {
      return redirect("/admin/login");
    }

    const formData = await request.formData();
    const id = String(formData.get("id") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const dateLine = String(formData.get("dateLine") || "").trim();
    const sortOrderRaw = String(formData.get("sortOrder") || "0").trim();
    const status = String(formData.get("status") || "draft").trim();
    const imageUrl = String(formData.get("existingImageUrl") || "").trim() || null;
    const imagePath = String(formData.get("existingImagePath") || "").trim() || null;
    const obsoleteImagePath = String(formData.get("obsoleteImagePath") || "").trim();
    const target = id ? `/admin/flash/${id}` : "/admin/flash/nueva";

    if (!category || !title || !body || !dateLine) {
      return redirectWithError(target, "Completa categoria, titulo, texto y fecha en linea.");
    }

    if (status !== "draft" && status !== "published") {
      return redirectWithError(target, "El estado no es valido.");
    }

    const sortOrder = Number.parseInt(sortOrderRaw, 10);
    const sortOrderSafe = Number.isFinite(sortOrder) ? sortOrder : 0;

    if (!imageUrl || !imagePath) {
      return redirectWithError(target, "Debes subir una imagen para la diapositiva.");
    }

    if (obsoleteImagePath && obsoleteImagePath !== imagePath) {
      await removeSiteMediaPath(obsoleteImagePath);
    }

    const saved = await saveFlashSlide({
      ...(id ? { id } : {}),
      category,
      title,
      body,
      dateLine,
      sortOrder: sortOrderSafe,
      status,
      imageUrl,
      imagePath,
    });

    return redirect(`/admin/flash/${saved.id}?saved=1`);
  } catch (error) {
    console.error("Error guardando flash informativo", error);
    return redirect("/admin?error=flash");
  }
};
