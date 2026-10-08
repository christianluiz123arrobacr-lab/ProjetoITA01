import type { Session } from "@supabase/supabase-js";
import { bounded, isInvalidCredential, safeErrorCode } from "@shared/authRecovery";
import { supabase } from "./supabase";

type Snapshot = { session: Session | null; loading: boolean; error: Error | null; recovering: boolean };
const ATTEMPTS = 3;

/** Bounded recovery shared by hooks and transports. No polling, role cache or navigation. */
export function createSessionController(auth: typeof supabase.auth) {
  let snapshot: Snapshot = { session: null, loading: true, error: null, recovering: false };
  let subscription: ReturnType<typeof auth.onAuthStateChange>["data"]["subscription"] | undefined;
  let revision = 0;
  let signedOut = false;
  let pendingLogoutRevision: number | null = null;
  const rejectedTokens = new Set<string>();
  let inFlight: Promise<Session | null> | null = null;
  let cancellation: AbortController | null = null;
  // getSession has no AbortSignal API. Reuse an unresolved SDK call after a timeout,
  // rather than accumulating abandoned calls behind the SDK refresh lock.
  let providerRead: ReturnType<typeof auth.getSession> | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()); };
  const accept = (session: Session | null) => {
    revision++;
    cancellation?.abort();
    cancellation = null;
    inFlight = null;
    providerRead = null;
    if (session && rejectedTokens.has(session.access_token)) session = null;
    publish({ session, loading: false, error: null, recovering: false });
  };
  const providerLogout = async (scope?: "local") => {
    const generation = revision;
    pendingLogoutRevision = generation;
    try { return await bounded(auth.signOut(scope ? { scope } : undefined)); }
    finally { if (pendingLogoutRevision === generation) pendingLogoutRevision = null; }
  };
  const read = () => {
    if (inFlight) return inFlight;
    const generation = revision;
    const controller = new AbortController();
    cancellation = controller;
    const correlationId = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
    const operation = (async () => {
      for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
        const started = Date.now();
        try {
          if (attempt) {
            let timer: ReturnType<typeof setTimeout> | undefined;
            try { await bounded(new Promise<void>(r => { timer = setTimeout(r, attempt * 1000); }), 4000, controller.signal); }
            finally { clearTimeout(timer); }
          }
          if (generation !== revision) return snapshot.session;
          if (!providerRead) {
            const pending = auth.getSession();
            providerRead = pending;
            void pending.finally(() => { if (providerRead === pending) providerRead = null; }).catch(() => {});
          }
          const { data, error } = await bounded(providerRead, 8000, controller.signal);
          if (generation !== revision) return snapshot.session;
          if (error) throw error;
          console.info({ event: "client_session_check", correlation_id: correlationId, stage: "sdk_session", outcome: data.session && !signedOut ? "available" : "missing", attempt: attempt + 1, duration_ms: Date.now() - started });
          accept(signedOut ? null : data.session);
          return snapshot.session;
        } catch (error) {
          if (generation !== revision) return snapshot.session;
          console.warn({ event: "client_session_check", correlation_id: correlationId, stage: "sdk_session", outcome: isInvalidCredential(error) ? "invalid" : "unavailable", attempt: attempt + 1, code: safeErrorCode(error), duration_ms: Date.now() - started });
          if (isInvalidCredential(error)) {
            if (snapshot.session) rejectedTokens.add(snapshot.session.access_token);
            accept(null);
            return null;
          }
          publish({ ...snapshot, loading: snapshot.session ? false : attempt < ATTEMPTS - 1, recovering: attempt < ATTEMPTS - 1,
            error: new Error("Não foi possível carregar sua sessão. Tente novamente.") });
        }
      }
      throw snapshot.error;
    })();
    inFlight = operation;
    void operation.finally(() => {
      if (inFlight === operation) { inFlight = null; cancellation = null; }
    }).catch(() => {});
    return operation;
  };
  const start = () => {
    if (subscription) return;
    subscription = auth.onAuthStateChange((event, session) => {
      // No async SDK calls inside this callback (SDK refresh holds a lock).
      if (event === "SIGNED_OUT") {
        // The SDK may finish an older logout after a new SIGNED_IN event.
        if (pendingLogoutRevision != null && revision !== pendingLogoutRevision && snapshot.session) return;
        if (snapshot.session) rejectedTokens.add(snapshot.session.access_token);
        signedOut = true;
      }
      if (event === "SIGNED_IN") signedOut = false;
      if (event !== "INITIAL_SESSION" && !(signedOut && session)) accept(session);
    }).data.subscription;
    void read().catch(() => {});
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      // main.tsx keeps a permanent cache-invalidation subscriber. A newly
      // mounted consumer must still be able to start one bounded recovery.
      const remount = snapshot.error && !inFlight;
      start();
      if (remount) void read().catch(() => {});
      return () => { listeners.delete(listener); };
    },
    async getSession() {
      start();
      if (inFlight) return inFlight;
      if (snapshot.error) throw snapshot.error;
      return read(); // SDK-supported refresh, never a cached expired JWT.
    },
    async retry() {
      start();
      if (inFlight) { try { await inFlight; } catch { /* snapshot owns the error */ } return; }
      publish({ ...snapshot, loading: !snapshot.session, recovering: true, error: null });
      try { await read(); } catch { /* snapshot owns the error */ }
    },
    async rejectInvalidToken(token: string) {
      if (snapshot.session?.access_token !== token || rejectedTokens.has(token)) return;
      rejectedTokens.add(token);
      accept(null);
      try { await providerLogout("local"); } catch {
        console.warn({ event: "client_session_check", outcome: "local_logout_unavailable" });
      }
    },
    signOut: () => {
      signedOut = true;
      if (snapshot.session) rejectedTokens.add(snapshot.session.access_token);
      accept(null);
      return providerLogout();
    },
    dispose() {
      revision++; cancellation?.abort(); subscription?.unsubscribe(); subscription = undefined;
      inFlight = null; providerRead = null; listeners.clear();
    },
  };
}

export const authSession = createSessionController(supabase.auth);
