import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "./supabase";

export function createAuthenticatedTrpcLink() {
  return httpBatchLink({
    url: "/api/trpc",
    transformer: superjson,
    async fetch(input, init) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = new Headers(init?.headers ?? {});
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
      }

      return globalThis.fetch(input, {
        ...(init ?? {}),
        credentials: "include",
        headers,
      });
    },
  });
}
