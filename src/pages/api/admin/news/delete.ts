import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { deleteNewsArticle } from "../../../../lib/server/news-admin";
import { isSupabaseConfigured } from "../../../../lib/server/supabase";

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

    if (!id) {
      return redirect("/admin?error=delete");
    }

    await deleteNewsArticle(id);
    return redirect("/admin?deleted=1");
  } catch (error) {
    console.error("Error eliminando noticia", error);
    return redirect("/admin?error=delete");
  }
};
