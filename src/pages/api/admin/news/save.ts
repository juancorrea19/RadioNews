import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import {
  isCoverMediaType,
  isNewsCategory,
  isNewsVideoFile,
  NEWS_IMAGE_MAX_BYTES,
  NEWS_VIDEO_MAX_BYTES,
  removeNewsStoragePath,
  saveNewsArticle,
  uploadNewsImage,
  uploadNewsVideo,
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
    const existingCoverImageUrl = String(formData.get("existingCoverImageUrl") || "").trim();
    const existingCoverImagePath = String(formData.get("existingCoverImagePath") || "").trim();
    const existingCoverVideoUrl = String(formData.get("existingCoverVideoUrl") || "").trim();
    const existingCoverVideoPath = String(formData.get("existingCoverVideoPath") || "").trim();
    const image = formData.get("coverImage");
    const video = formData.get("coverVideo");
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

    let coverImageUrl = existingCoverImageUrl || null;
    let coverImagePath = existingCoverImagePath || null;
    let coverVideoUrl = existingCoverVideoUrl || null;
    let coverVideoPath = existingCoverVideoPath || null;

    if (image instanceof File && image.size > 0) {
      if (image.size > NEWS_IMAGE_MAX_BYTES) {
        return redirectWithError(target, "La imagen supera el limite de 6 MB.");
      }

      const uploaded = await uploadNewsImage(image, coverImagePath);
      coverImageUrl = uploaded.publicUrl;
      coverImagePath = uploaded.path;
    }

    if (video instanceof File && video.size > 0) {
      if (!isNewsVideoFile(video)) {
        return redirectWithError(target, "El video debe ser MP4, WebM o MOV.");
      }

      if (video.size > NEWS_VIDEO_MAX_BYTES) {
        return redirectWithError(target, "El video supera el limite de 100 MB.");
      }

      const uploaded = await uploadNewsVideo(video, coverVideoPath);
      coverVideoUrl = uploaded.publicUrl;
      coverVideoPath = uploaded.path;
    }

    if (coverMediaType === "video") {
      if (!coverVideoUrl) {
        return redirectWithError(target, "Debes subir un video principal.");
      }
    } else {
      if (!coverImageUrl) {
        return redirectWithError(target, "Debes subir una imagen principal.");
      }

      if (existingCoverVideoPath) {
        await removeNewsStoragePath(existingCoverVideoPath);
      }

      coverVideoUrl = null;
      coverVideoPath = null;
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
      coverImageUrl,
      coverImagePath,
      coverVideoUrl,
      coverVideoPath,
    });

    return redirect(`/admin/noticias/${saved.id}?saved=1`);
  } catch (error) {
    console.error("Error guardando noticia en el panel admin", error);
    return redirect("/admin?error=save");
  }
};
