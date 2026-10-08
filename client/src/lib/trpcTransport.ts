import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { authSession } from "./authSession";
import { bounded } from "@shared/authRecovery";

export function isProvenInvalidResponse(payload: unknown): boolean {
  const entries = Array.isArray(payload) ? payload : [payload];
  return entries.some(entry => {
    const data = entry?.error?.json?.data ?? entry?.error?.data;
    return data?.authStatus === "invalid" && ["UNAUTHORIZED", "FORBIDDEN"].includes(data?.code);
  });
}

export function createAuthenticatedFetch(sessionController = authSession, fetcher = globalThis.fetch) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const session = await sessionController.getSession();
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
      })(), 25000);
      if (session?.access_token && response.headers.get("content-type")?.includes("json")) {
        const payload = await response.clone().json().catch(() => null);
        if (isProvenInvalidResponse(payload)) void sessionController.rejectInvalidToken(session.access_token);
      }
      return response;
    } finally {
      controller.abort();
      init?.signal?.removeEventListener("abort", abort);
    }
  };
}

export function createAuthenticatedTrpcLink() {
  return httpBatchLink({
    url: "/api/trpc",
    transformer: superjson,
    fetch: createAuthenticatedFetch(),
  });
}
