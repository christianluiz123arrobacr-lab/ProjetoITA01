// Local visual fixture only: no real credentials and no Supabase connection.
import type { Session } from "@supabase/supabase-js";
let callback = (_event: string, _session: Session | null) => {};
let session = { access_token: "fixture-token", user: { id: "fixture-user" } } as Session | null;
export function fixtureSession(next: Session | null) { session = next; callback(next ? "SIGNED_IN" : "SIGNED_OUT", next); }
export const supabase = { auth: {
  getSession: async () => ({ data: { session }, error: null }),
  onAuthStateChange: (fn: typeof callback) => { callback = fn; return { data: { subscription: { unsubscribe: () => { callback = () => {}; } } } }; },
  signOut: async () => { fixtureSession(null); return { error: null }; },
} };
