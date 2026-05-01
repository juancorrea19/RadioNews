import type { APIRoute } from "astro";
import { clearAdminSessionCookies } from "../../../lib/server/admin-auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearAdminSessionCookies(cookies);
  return redirect("/admin/login");
};
