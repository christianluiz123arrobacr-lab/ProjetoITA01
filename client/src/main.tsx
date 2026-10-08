import { trpc } from "@/lib/trpc";
import { initializeAnalytics } from "@/lib/analytics";
import { createAuthenticatedTrpcLink } from "@/lib/trpcTransport";
import { authSession } from "@/lib/authSession";
import { clearCachedPlatformAccess } from "@/services/access.service";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { invalidateQuestionCaches } from "@/lib/questionCache";
import { TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "katex/dist/katex.min.css";

const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation): void =>
      invalidateQuestionCaches(queryClient, mutation.options.mutationKey),
  }),
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        count < 1 &&
        error instanceof TRPCClientError &&
        !["UNAUTHORIZED", "FORBIDDEN", "SERVICE_UNAVAILABLE"].includes(
          error.data?.code
        ),
      retryDelay: 2000,
    },
  },
});

let sessionUserId: string | null = null;
authSession.subscribe(() => {
  const nextId = authSession.getSnapshot().session?.user.id ?? null;
  if (nextId !== sessionUserId) {
    clearCachedPlatformAccess(sessionUserId);
    queryClient.clear(); // Permissions cached for a previous user must not survive a session switch.
    sessionUserId = nextId;
  }
});

const logApiError = (error: unknown) => {
  const data = error instanceof TRPCClientError ? error.data : undefined;
  console.warn({
    event: "api_request_failed",
    code: data?.code ?? "client_transport_error",
    http_status: data?.httpStatus,
    correlation_id: data?.correlationId,
  });
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    logApiError(error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    logApiError(error);
  }
});

const trpcClient = trpc.createClient({
  links: [createAuthenticatedTrpcLink()],
});

initializeAnalytics();

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
