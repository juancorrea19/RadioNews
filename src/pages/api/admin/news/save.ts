import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import {
  isCoverMediaType,
  isNewsCategory,
  removeNewsStoragePath,
  saveNewsArticle,
} from "../../../../lib/server/news-admin";
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
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const excerpt = String(formData.get("excerpt") || "").trim();
    const author = String(formData.get("author") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const publishedAt = String(formData.get("publishedAt") || "").trim();
    const status = String(formData.get("status") || "draft").trim();
    const coverMediaType = String(formData.get("coverMediaType") || "image").trim();
    const coverImageUrl = String(formData.get("existingCoverImageUrl") || "").trim() || null;
    const coverImagePath = String(formData.get("existingCoverImagePath") || "").trim() || null;
    const coverVideoUrl = String(formData.get("existingCoverVideoUrl") || "").trim() || null;
    const coverVideoPath = String(formData.get("existingCoverVideoPath") || "").trim() || null;
    const obsoleteCoverImagePath = String(formData.get("obsoleteCoverImagePath") || "").trim();
    const obsoleteCoverVideoPath = String(formData.get("obsoleteCoverVideoPath") || "").trim();
    const target = id ? `/admin/noticias/${id}` : "/admin/noticias/nueva";

    if (!title || !body || !publishedAt) {
      return redirectWithError(target, "Completa titulo, fecha y articulo.");
    }

    const publishedAtMs = new Date(publishedAt).getTime();
    if (Number.isNaN(publishedAtMs)) {
      return redirectWithError(target, "La fecha de publicacion no es valida.");
    }

    if (!isNewsCategory(category)) {
      return redirectWithError(target, "La categoria seleccionada no es valida.");
    }

    if (status !== "draft" && status !== "published") {
      return redirectWithError(target, "El estado de la noticia no es valido.");
    }

    if (!isCoverMediaType(coverMediaType)) {
      return redirectWithError(target, "El tipo de portada no es valido.");
    }

    let finalImageUrl = coverImageUrl;
    let finalImagePath = coverImagePath;
    let finalVideoUrl = coverVideoUrl;
    let finalVideoPath = coverVideoPath;

    if (coverMediaType === "video") {
      if (!finalVideoUrl || !finalVideoPath) {
        return redirectWithError(target, "Debes subir un video principal.");
      }
    } else {
      if (!finalImageUrl || !finalImagePath) {
        return redirectWithError(target, "Debes subir una imagen principal.");
      }

      if (finalVideoPath) {
        await removeNewsStoragePath(finalVideoPath);
      }
      if (obsoleteCoverVideoPath && obsoleteCoverVideoPath !== finalVideoPath) {
        await removeNewsStoragePath(obsoleteCoverVideoPath);
      }

      finalVideoUrl = null;
      finalVideoPath = null;
    }

    if (obsoleteCoverImagePath && obsoleteCoverImagePath !== finalImagePath) {
      await removeNewsStoragePath(obsoleteCoverImagePath);
    }

    if (coverMediaType === "video" && obsoleteCoverVideoPath && obsoleteCoverVideoPath !== finalVideoPath) {
      await removeNewsStoragePath(obsoleteCoverVideoPath);
    }

    const saved = await saveNewsArticle({
      ...(id ? { id } : {}),
      title,
      category,
      excerpt,
      author,
      body,
      publishedAt: new Date(publishedAtMs).toISOString(),
      status,
      coverMediaType,
      coverImageUrl: finalImageUrl,
      coverImagePath: finalImagePath,
      coverVideoUrl: finalVideoUrl,
      coverVideoPath: finalVideoPath,
    });

    return redirect(`/admin/noticias/${saved.id}?saved=1`);
  } catch (error) {
    console.error("Error guardando noticia en el panel admin", error);
    return redirect("/admin?error=save");
  }
};
