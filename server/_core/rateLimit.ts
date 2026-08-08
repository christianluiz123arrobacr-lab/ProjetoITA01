import type { IncomingMessage } from "node:http";
import { TRPCError } from "@trpc/server";

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  allowInMemoryFallback?: boolean;
};

type LocalBucket = { count: number; expiresAt: number };
const localBuckets = new Map<string, LocalBucket>();

function assertLocalRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = localBuckets.get(key);
  const bucket = !current || current.expiresAt <= now
    ? { count: 0, expiresAt: now + windowMs }
    : current;
  bucket.count += 1;
  localBuckets.set(key, bucket);

  if (bucket.count > limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
    });
  }
}

export function getClientIp(req: IncomingMessage) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers["x-real-ip"];

  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket.remoteAddress ?? "unknown";
}

export async function assertRateLimit({
  key,
  limit,
  windowMs,
  allowInMemoryFallback = false,
}: RateLimitOptions) {
  const { supabaseAdmin } = await import("./supabaseAdmin.js");
  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_bucket_key: key,
    p_limit: limit,
    p_window_ms: windowMs,
  });

  if (error) {
    const sharedFunctionMissing = error.code === "PGRST202";
    if (allowInMemoryFallback && sharedFunctionMissing) {
      console.warn("[rateLimit] shared bucket missing; using process-local fallback", {
        code: error.code,
      });
      assertLocalRateLimit({ key, limit, windowMs });
      return;
    }
    console.error("[rateLimit] shared bucket unavailable", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível validar o limite de requisições. Tente novamente em instantes.",
    });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || !result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
    });
  }
}

export async function assertRequestRateLimit(
  req: IncomingMessage,
  scope: string,
  options: Omit<RateLimitOptions, "key">
) {
  await assertRateLimit({
    ...options,
    key: `${scope}:${getClientIp(req)}`,
  });
}
