import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import {
  isNewsCategory,
  saveNewsArticle,
  uploadNewsImage,
} from "../../../../lib/server/news-admin";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";

type RedirectFn = (path: string, status?: number) => Response;

function redirectWithError(redirect: RedirectFn, target: string, message: string) {
  return redirect(`${target}?error=${encodeURIComponent(message)}`);
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
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
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const excerpt = String(formData.get("excerpt") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const publishedAt = String(formData.get("publishedAt") || "").trim();
    const status = String(formData.get("status") || "draft").trim();
    const existingCoverImageUrl = String(formData.get("existingCoverImageUrl") || "").trim();
    const existingCoverImagePath = String(formData.get("existingCoverImagePath") || "").trim();
    const image = formData.get("coverImage");
    const target = id ? `/admin/noticias/${id}` : "/admin/noticias/nueva";

    if (!title || !body || !publishedAt) {
      return redirectWithError(redirect, target, "Completa titulo, fecha y articulo.");
    }

    if (!isNewsCategory(category)) {
      return redirectWithError(redirect, target, "La categoria seleccionada no es valida.");
    }

    if (status !== "draft" && status !== "published") {
      return redirectWithError(redirect, target, "El estado de la noticia no es valido.");
    }

    let coverImageUrl = existingCoverImageUrl || null;
    let coverImagePath = existingCoverImagePath || null;

    if (image instanceof File && image.size > 0) {
      if (image.size > 6 * 1024 * 1024) {
        return redirectWithError(redirect, target, "La imagen supera el limite recomendado de 6 MB.");
      }

      const uploaded = await uploadNewsImage(image, coverImagePath);
      coverImageUrl = uploaded.publicUrl;
      coverImagePath = uploaded.path;
    }

    if (!coverImageUrl) {
      return redirectWithError(redirect, target, "Debes subir una imagen principal.");
    }

    const saved = await saveNewsArticle({
      ...(id ? { id } : {}),
      title,
      category,
      excerpt,
      author,
      body,
      publishedAt: new Date(publishedAt).toISOString(),
      status,
      coverImageUrl,
      coverImagePath,
    });

    return redirect(`/admin/noticias/${saved.id}?saved=1`);
  } catch (error) {
    console.error("Error guardando noticia en el panel admin", error);
    return redirect("/admin?error=save");
  }
};
