import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return import.meta.env.SUPABASE_URL;
}

function getSupabasePublishableKey() {
  return import.meta.env.SUPABASE_PUBLISHABLE_KEY;
}

function getSupabaseServiceRoleKey() {
  return import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey() && getSupabaseServiceRoleKey());
}

export function createSupabasePublicClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
