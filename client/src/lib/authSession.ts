import type { Session } from "@supabase/supabase-js";
import { bounded, safeErrorCode } from "@shared/authRecovery";
import { supabase } from "./supabase";

type Snapshot = { session: Session | null; loading: boolean; error: Error | null };

/** One bounded session read shared by the hooks and transport; never polls or navigates. */
export function createSessionController(auth: typeof supabase.auth) {
  let snapshot: Snapshot = { session: null, loading: true, error: null };
  let started = false;
  let revision = 0;
  let rejectedToken: string | null = null;
  let inFlight: Promise<Session | null> | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()); };
  const accept = (session: Session | null) => {
    revision++;
    if (session?.access_token === rejectedToken) session = null;
    publish({ session, loading: false, error: null });
  };
  const read = () => {
    if (inFlight) return inFlight;
    const generation = revision;
    inFlight = (async () => {
      try {
        const { data, error } = await bounded(auth.getSession());
        if (error) throw error;
        if (generation === revision) accept(data.session);
      } catch (error) {
        if (generation === revision) {
          console.warn({ event: "client_session_check", outcome: "unavailable", code: safeErrorCode(error) });
          publish({ ...snapshot, loading: false, error: new Error("Não foi possível carregar sua sessão. Tente novamente.") });
        }
      }
      if (snapshot.error) throw snapshot.error;
      return snapshot.session;
    })().finally(() => { inFlight = null; });
    return inFlight;
  };
  const start = () => {
    if (started) return;
    started = true;
    auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION may be null after a failed SDK read; our bounded read
      // owns startup errors and must not be replaced with a false "logged out".
      if (event !== "INITIAL_SESSION") accept(session);
    });
    void read().catch(() => {});
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      start();
      return () => { listeners.delete(listener); };
    },
    async getSession() {
      start();
      if (inFlight) return inFlight;
      if (snapshot.error) throw snapshot.error;
      // Re-read so SDK refreshes an expired token, rather than sending cached credentials.
      return read();
    },
    async retry() {
      start();
      publish({ ...snapshot, loading: true, error: null });
      try { await read(); } catch { /* error is exposed in the snapshot */ }
    },
    async rejectInvalidToken(token: string) {
      if (snapshot.session?.access_token !== token || rejectedToken === token) return;
      rejectedToken = token;
      accept(null); // Stop the login bounce immediately, even if provider logout is unavailable.
      try { await bounded(auth.signOut({ scope: "local" })); } catch {
        console.warn({ event: "client_session_check", outcome: "local_logout_unavailable" });
      }
    },
    signOut: () => bounded(auth.signOut()),
  };
}

export const authSession = createSessionController(supabase.auth);
