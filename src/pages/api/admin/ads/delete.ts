import type { APIRoute } from "astro";
import { getAuthenticatedAdmin } from "../../../../lib/server/admin-auth";
import { deleteAdSlot, isAdSlotKey } from "../../../../lib/server/site-cms";
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
    const slotKey = String(formData.get("slotKey") || "").trim();

    if (!isAdSlotKey(slotKey)) {
      return redirect("/admin/publicidad?error=slot");
    }

    await deleteAdSlot(slotKey);
    return redirect(`/admin/publicidad?cleared=1&slot=${encodeURIComponent(slotKey)}`);
  } catch (error) {
    console.error("Error eliminando banner publicitario", error);
    return redirect("/admin/publicidad?error=delete");
  }
};
