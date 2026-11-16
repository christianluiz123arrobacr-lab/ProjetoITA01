import { httpBatchLink, splitLink } from "@trpc/client";
import superjson from "superjson";
import { authSession } from "./authSession";
import { bounded } from "@shared/authRecovery";
import { isAdminRequestSuspended } from "./adminRevalidation";

export function isProvenInvalidResponse(payload: unknown): boolean {
  const entries = Array.isArray(payload) ? payload : [payload];
  return entries.some(entry => {
    const data = entry?.error?.json?.data ?? entry?.error?.data;
    return data?.authStatus === "invalid" && ["UNAUTHORIZED", "FORBIDDEN"].includes(data?.code);
  });
}

export function createAuthenticatedFetch(sessionController = authSession, fetcher = globalThis.fetch) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const started = Date.now();
    const correlationId = globalThis.crypto?.randomUUID?.() ?? `transport-${started}`;
    // Cancelling one caller must not cancel shared SDK recovery for other callers.
    const session = init?.signal
      ? await bounded(sessionController.getSession(), 30000, init.signal)
      : await sessionController.getSession();
    if (init?.signal?.aborted) throw new DOMException("Operação interrompida.", "AbortError");
    const url = new URL(typeof input === "object" && "url" in input ? input.url : String(input), "http://local.invalid");
    const paths = url.pathname.split("/api/trpc/")[1]?.split(",") ?? [];
    const recoveryRequest = paths.length > 0 && paths.every(path => ["auth.me", "auth.getAccessStatus", "legal.publicConfig"].includes(path));
    if (isAdminRequestSuspended(session?.user.id) && !recoveryRequest) {
      throw new Error("As operações estão pausadas até confirmar seu acesso novamente.");
    }
    const headers = new Headers(init?.headers ?? {});
    headers.delete("Authorization");
    if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (init?.signal?.aborted) abort();
    init?.signal?.addEventListener("abort", abort, { once: true });
    try {
      // Bound headers AND body. A hung request cannot keep the access guard spinning.
      const response = await bounded((async () => {
        const original = await fetcher(input, { ...init, credentials: "include", headers, signal: controller.signal });
        const body = await original.arrayBuffer();
        return new Response(body.byteLength ? body : null, { status: original.status, statusText: original.statusText, headers: original.headers });
      })(), 25000, controller.signal);
      if (session?.access_token && response.headers.get("content-type")?.includes("json")) {
        const payload = await response.clone().json().catch(() => null);
        if (isProvenInvalidResponse(payload)) void sessionController.rejectInvalidToken(session.access_token);
      }
      console.info({ event: "authenticated_transport", correlation_id: correlationId, stage: "request", outcome: response.ok ? "success" : "error", http_status: response.status, duration_ms: Date.now() - started });
      return response;
    } catch (error) {
      console.warn({ event: "authenticated_transport", correlation_id: correlationId, stage: "request", outcome: "unavailable", duration_ms: Date.now() - started });
      throw error;
    } finally {
      controller.abort();
      init?.signal?.removeEventListener("abort", abort);
    }
  };
}

export function createAuthenticatedTrpcLink(sessionController = authSession, fetcher = globalThis.fetch) {
  const options = {
    url: "/api/trpc",
    transformer: superjson,
    fetch: createAuthenticatedFetch(sessionController, fetcher),
  };
  // Access checks must not wait for unrelated page queries in the same batch.
  return splitLink({
    condition: op => ["auth.me", "auth.getAccessStatus"].includes(op.path),
    true: httpBatchLink(options),
    false: httpBatchLink(options),
  });
}
