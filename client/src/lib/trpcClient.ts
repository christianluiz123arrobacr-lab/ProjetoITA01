import { createTRPCProxyClient } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import { createAuthenticatedTrpcLink } from "./trpcTransport";

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [createAuthenticatedTrpcLink()],
});
