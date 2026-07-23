import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseAdminClient = SupabaseClient<any, "public", any>;

let client: SupabaseAdminClient | null = null;

export function getSupabaseAdmin(): SupabaseAdminClient {
  if (client) return client;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin env vars não configuradas.");
  }
  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

// Preserve the existing fluent API while delaying credential validation until
// a database operation is actually attempted. Pure router/unit imports remain safe.
export const supabaseAdmin = new Proxy({} as SupabaseAdminClient, {
  get(_target, property) {
    const value = Reflect.get(getSupabaseAdmin(), property);
    return typeof value === "function" ? value.bind(getSupabaseAdmin()) : value;
  },
});
