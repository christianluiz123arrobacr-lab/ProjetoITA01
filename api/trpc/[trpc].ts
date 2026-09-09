import { nodeHTTPRequestHandler } from "@trpc/server/adapters/node-http";
import { appRouter } from "../../server/routers.js";
import { createContext } from "../../server/_core/context.js";

// Registration performs rate-limit, Auth and profile operations against
// Supabase. Give cold serverless invocations enough time to finish and return
// a valid tRPC JSON response instead of a platform timeout body.
export const config = { maxDuration: 30 };

function getTrpcPath(req: any) {
  const trpcPath = req.query?.trpc;

  if (Array.isArray(trpcPath)) {
    return trpcPath.join("/");
  }

  if (typeof trpcPath === "string" && trpcPath.length > 0) {
    return trpcPath;
  }

  const url = typeof req.url === "string" ? req.url : "";
  const pathname = url.split("?")[0] ?? "";

  return pathname
    .replace(/^\/api\/trpc\/?/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export default async function vercelTrpcHandler(req: any, res: any) {
  return nodeHTTPRequestHandler({
    req,
    res,
    router: appRouter,
    path: getTrpcPath(req),
    createContext,
    onError({ error, path }) {
      console.error("[trpc] request failed", {
        path,
        code: error.code,
        message: error.message,
      });
    },
  });
}
