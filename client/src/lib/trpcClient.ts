import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";
import { supabase } from "./supabase";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        const headers = new Headers();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          headers.set("Authorization", `Bearer ${session.access_token}`);
        }

        return headers;
      },
    }),
  ],
});
