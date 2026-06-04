import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { deleteFlashSlide } from "../../../../lib/server/site-cms";
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
      return redirect("/admin/flash?error=id");
    }

    await deleteFlashSlide(id);
    return redirect("/admin/flash?deleted=1");
  } catch (error) {
    console.error("Error eliminando diapositiva de flash", error);
    return redirect("/admin/flash?error=delete");
  }
};
