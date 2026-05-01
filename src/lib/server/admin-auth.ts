import type { AstroCookies } from "astro";
import type { Session, User } from "@supabase/supabase-js";
import { createSupabasePublicClient, isSupabaseConfigured } from "./supabase";

const ACCESS_COOKIE = "rn_admin_access_token";
const REFRESH_COOKIE = "rn_admin_refresh_token";

export function isAllowedAdminEmail(email?: string | null) {
  const raw = import.meta.env.ADMIN_ALLOWED_EMAILS;

  if (!raw) {
    return true;
  }

  const allowed = raw
    .split(",")
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) {
    return true;
  }

  return Boolean(email && allowed.includes(email.toLowerCase()));
}

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: import.meta.env.PROD,
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

export function clearAdminSessionCookies(cookies: AstroCookies) {
  cookies.delete(ACCESS_COOKIE, { path: "/" });
  cookies.delete(REFRESH_COOKIE, { path: "/" });
}

export function setAdminSessionCookies(cookies: AstroCookies, session: Session) {
  const expiresIn = typeof session.expires_in === "number" ? session.expires_in : 60 * 60;

  cookies.set(ACCESS_COOKIE, session.access_token, getCookieOptions(expiresIn));
  cookies.set(REFRESH_COOKIE, session.refresh_token, getCookieOptions(60 * 60 * 24 * 30));
}

async function validateUser(accessToken: string) {
  const supabase = createSupabasePublicClient();
  return supabase.auth.getUser(accessToken);
}

async function refreshUserSession(accessToken: string, refreshToken: string) {
  const supabase = createSupabasePublicClient();

  return supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

export async function getAuthenticatedAdmin(cookies: AstroCookies): Promise<{
  user: User | null;
  accessToken: string | null;
  refreshed: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { user: null, accessToken: null, refreshed: false };
  }

  const accessToken = cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken || !refreshToken) {
    return { user: null, accessToken: null, refreshed: false };
  }

  const { data, error } = await validateUser(accessToken);

  if (!error && data.user) {
    if (!isAllowedAdminEmail(data.user.email)) {
      clearAdminSessionCookies(cookies);
      return { user: null, accessToken: null, refreshed: false };
    }

    return { user: data.user, accessToken, refreshed: false };
  }

  const refreshed = await refreshUserSession(accessToken, refreshToken);

  if (refreshed.error || !refreshed.data.session || !refreshed.data.user) {
    clearAdminSessionCookies(cookies);
    return { user: null, accessToken: null, refreshed: false };
  }

  if (!isAllowedAdminEmail(refreshed.data.user.email)) {
    clearAdminSessionCookies(cookies);
    return { user: null, accessToken: null, refreshed: false };
  }

  setAdminSessionCookies(cookies, refreshed.data.session);

  return {
    user: refreshed.data.user,
    accessToken: refreshed.data.session.access_token,
    refreshed: true,
  };
}
