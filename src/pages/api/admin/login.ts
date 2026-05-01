import type { APIRoute } from "astro";
import {
  clearAdminSessionCookies,
  isAllowedAdminEmail,
  setAdminSessionCookies,
} from "../../../lib/server/admin-auth";
import { createSupabasePublicClient, isSupabaseConfigured } from "../../../lib/server/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    if (!isSupabaseConfigured()) {
      return redirect("/admin/login?error=config");
    }

    const formData = await request.formData();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      return redirect("/admin/login?error=credenciales");
    }

    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      clearAdminSessionCookies(cookies);
      return redirect("/admin/login?error=credenciales");
    }

    if (!isAllowedAdminEmail(data.user.email)) {
      clearAdminSessionCookies(cookies);
      return redirect("/admin/login?error=acceso");
    }

    setAdminSessionCookies(cookies, data.session);
    return redirect("/admin");
  } catch (error) {
    console.error("Error iniciando sesion en el panel admin", error);
    clearAdminSessionCookies(cookies);
    return redirect("/admin/login?error=credenciales");
  }
};
