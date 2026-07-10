import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const headers = new Headers();

        if (typeof window !== "undefined") {
          const accessToken = window.localStorage.getItem("supabase_access_token");

          if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
          }
        }

        return headers;
      },
    }),
  ],
});
