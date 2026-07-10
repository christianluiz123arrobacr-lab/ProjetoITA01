import type { IncomingMessage } from "node:http";
import { TRPCError } from "@trpc/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

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

export function assertRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (current.count >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
    });
  }

  current.count += 1;
}

export function assertRequestRateLimit(
  req: IncomingMessage,
  scope: string,
  options: Omit<RateLimitOptions, "key">
) {
  assertRateLimit({
    ...options,
    key: `${scope}:${getClientIp(req)}`,
  });
}
