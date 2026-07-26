import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabaseAdmin.js", () => ({
  supabaseAdmin: { rpc },
}));

import {
  assertRateLimit,
  assertRequestRateLimit,
  getClientIp,
} from "./rateLimit.js";

describe("shared rate limit", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("allows a request when the shared bucket allows it", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 60 }],
      error: null,
    });

    await expect(
      assertRateLimit({ key: "test:user", limit: 2, windowMs: 60_000 })
    ).resolves.toBeUndefined();

    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_bucket_key: "test:user",
      p_limit: 2,
      p_window_ms: 60_000,
    });
  });

  it("rejects a request when the shared bucket is exhausted", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: false, retry_after_seconds: 60 }],
      error: null,
    });

    await expect(
      assertRateLimit({ key: "test:user", limit: 2, windowMs: 60_000 })
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: "TOO_MANY_REQUESTS" });
  });

  it("fails closed when the shared rate-limit function is unavailable", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });

    await expect(
      assertRateLimit({ key: "test:user", limit: 2, windowMs: 60_000 })
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("uses a bounded local fallback for explicitly opted-in low-risk operations", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    const options = {
      key: "pdf:user-without-shared-function",
      limit: 2,
      windowMs: 60_000,
      allowInMemoryFallback: true,
    };

    await expect(assertRateLimit(options)).resolves.toBeUndefined();
    await expect(assertRateLimit(options)).resolves.toBeUndefined();
    await expect(assertRateLimit(options)).rejects.toMatchObject<Partial<TRPCError>>({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("does not fall back for transient shared limiter errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST500" } });

    await expect(assertRateLimit({
      key: "pdf:transient-error",
      limit: 2,
      windowMs: 60_000,
      allowInMemoryFallback: true,
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("uses the first forwarded address for request limits", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 60 }],
      error: null,
    });
    const req = {
      headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" },
    } as any;

    expect(getClientIp(req)).toBe("203.0.113.10");
    await assertRequestRateLimit(req, "test:ip", {
      limit: 2,
      windowMs: 60_000,
    });
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_bucket_key: "test:ip:203.0.113.10",
      p_limit: 2,
      p_window_ms: 60_000,
    });
  });
});
