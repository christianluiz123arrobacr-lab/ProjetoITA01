import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }));
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
import { createContext, createTrpcContext, ensureAuthentication, assertAuthenticationAvailable } from "./_core/context.js";
import { router, protectedProcedure, publicProcedure, adminProcedure, adminOrEditorProcedure } from "./_core/trpc.js";
import { getPlatformAccessDecision, accessQuery } from "./_core/platformAccess.js";

const routes = router({
  access: protectedProcedure.query(({ ctx }) => ctx.user.role),
  admin: adminProcedure.query(() => true),
  editor: adminOrEditorProcedure.query(() => true),
  me: publicProcedure.query(async ({ ctx }) => { await ensureAuthentication(ctx); assertAuthenticationAvailable(ctx); return ctx.user; }),
  publicConfig: publicProcedure.query(() => true),
});
const options = (token?: string) => ({ req: { headers: token ? { authorization: `Bearer ${token}` } : {} } as IncomingMessage, res: {} as ServerResponse });
const query = (result: unknown) => {
  const q = { select: () => q, eq: () => q, maybeSingle: async () => result };
  return q;
};

describe("authentication recovery (mocked Supabase)", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    mocks.getUser.mockReset(); mocks.from.mockReset();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user", email: "private@example.test" } }, error: null });
    mocks.from.mockReturnValue(query({ data: null, error: null }));
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it.each(["student", "admin", "editor"])("validates a %s session", async role => {
    mocks.from.mockImplementation(table => query({ data: table === "admin_users" && role !== "student" ? { role } : null, error: null }));
    const ctx = await createContext(options("private-token"));
    expect(ctx.authentication?.status).toBe("verified");
    expect(await routes.createCaller(ctx).access()).toBe(role);
    if (role === "student") await expect(routes.createCaller(ctx).admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("denies a missing token without calling the provider", async () => {
    const ctx = await createContext(options());
    expect(ctx.authentication?.status).toBe("missing");
    expect(mocks.getUser).not.toHaveBeenCalled();
    await expect(routes.createCaller(ctx).access()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it.each(["bad_jwt", "session_expired"])("identifies proven invalid/expired %s credentials", async code => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { code, status: 401, message: "secret token private@example.test" } });
    const ctx = await createContext(options("secret-token"));
    expect(ctx.authentication?.status).toBe("invalid");
    await expect(routes.createCaller(ctx).access()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(routes.createCaller(ctx).admin()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toMatch(/secret-token|private@example/);
  });
  it.each([
    { code: "unexpected_failure", status: 500 },
    { code: "over_request_rate_limit", status: 429 },
    { status: 401 }, // A bare HTTP status is not proof of credential invalidity.
  ])("fails closed with 503 for an uncertain provider response %j", async error => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error });
    const ctx = await createContext(options("token"));
    expect(ctx.user).toBeNull();
    expect(ctx.authentication?.status).toBe("unavailable");
    const caller = routes.createCaller(ctx);
    for (const operation of [caller.access, caller.admin, caller.editor, caller.me]) {
      await expect(operation()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    }
    expect(await caller.publicConfig()).toBe(true);
  });
  it("bounds a hung provider and never authenticates", async () => {
    vi.useFakeTimers();
    mocks.getUser.mockReturnValue(new Promise(() => {}));
    const pending = createContext(options("token"));
    await vi.advanceTimersByTimeAsync(6001);
    const ctx = await pending;
    expect(ctx.authentication?.status).toBe("unavailable");
    await expect(routes.createCaller(ctx).access()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each(["bad_jwt", "unexpected_failure"])("serializes HTTP auth status safely for %s", async code => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { code } });
    const ctx = await createContext(options("secret-token"));
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc", req: new Request("https://example.test/api/trpc/access"),
      router: routes, createContext: () => ctx,
    });
    expect(response.status).toBe(code === "bad_jwt" ? 401 : 503);
    const payload = await response.json();
    expect(payload.error.json.data.authStatus).toBe(code === "bad_jwt" ? "invalid" : "unavailable");
    expect(payload.error.json.data.correlationId).toBe(ctx.authentication?.correlationId);
    expect(JSON.stringify(payload)).not.toContain("secret-token");
  });
  it("does not silently downgrade or grant a role when role lookup fails", async () => {
    mocks.from.mockReturnValue(query({ data: { role: "admin" }, error: { code: "connection_error" } }));
    const ctx = await createContext(options("token"));
    expect(ctx.user).toBeNull();
    await expect(routes.createCaller(ctx).admin()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("public-only requests avoid token and role checks, while concurrent protected calls share one check", async () => {
    mocks.from.mockImplementation(table => query({ data: table === "admin_users" ? { role: "admin" } : null, error: null }));
    const ctx = createTrpcContext(options("token"));
    const caller = routes.createCaller(ctx);
    expect(await caller.publicConfig()).toBe(true);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(await Promise.all([caller.access(), caller.admin(), caller.editor(), caller.me()])).toMatchObject(["admin", true, true, { role: "admin" }]);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledTimes(2);
    await routes.createCaller(createTrpcContext(options("token"))).access();
    expect(mocks.getUser).toHaveBeenCalledTimes(2); // No cross-request role cache.
  });
  it("measured simulated public latency avoids the former eager validation delay", async () => {
    vi.useFakeTimers();
    mocks.getUser.mockImplementation(() => new Promise(r => setTimeout(() => r({ data: { user: { id: "test-user" } }, error: null }), 1000)));
    mocks.from.mockImplementation(() => {
      const q = { select: () => q, eq: () => q, maybeSingle: () => new Promise(r => setTimeout(() => r({ data: null, error: null }), 2000)) };
      return q;
    });
    const before = Date.now();
    const oldPath = createContext(options("token")).then(ctx => routes.createCaller(ctx).publicConfig());
    await vi.advanceTimersByTimeAsync(3000); expect(await oldPath).toBe(true);
    expect(Date.now() - before).toBe(3000);
    const after = Date.now();
    expect(await routes.createCaller(createTrpcContext(options("token"))).publicConfig()).toBe(true);
    expect(Date.now() - after).toBe(0);
  });
  it("a new request sees revocation immediately", async () => {
    mocks.from.mockImplementation(table => query({ data: table === "admin_users" ? { role: "admin" } : null, error: null }));
    expect(await routes.createCaller(createTrpcContext(options("token"))).admin()).toBe(true);
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    await expect(routes.createCaller(createTrpcContext(options("token"))).admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("reuses a verified same-request profile for student access, never another user's", async () => {
    const from = vi.fn().mockReturnValue(query({ data: null, error: null }));
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const client = { from, rpc } as never;
    await expect(getPlatformAccessDecision({ id: "student", role: "student" }, client, { validatedProfile: { userId: "student", data: { role: "student", ativo: true } } })).resolves.toMatchObject({ allowed: true });
    expect(from).toHaveBeenCalledTimes(1); // pending payments only, no second profile read.
    from.mockClear();
    await getPlatformAccessDecision({ id: "student", role: "student" }, client, { validatedProfile: { userId: "other", data: { role: "admin" } } });
    expect(from).toHaveBeenCalledTimes(2);
  });
  it("handles thrown network failures without generating 401", async () => {
    mocks.getUser.mockRejectedValue(new Error("fetch failed secret"));
    const ctx = await createContext(options("token"));
    expect(ctx.authentication?.status).toBe("unavailable");
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("secret");
  });
  it("secondary profile failure is temporary, not unauthenticated", async () => {
    const client = { from: () => query({ data: null, error: { code: "connection_error" } }) } as never;
    await expect(getPlatformAccessDecision({ id: "student", role: "student" }, client)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("bounds secondary subscription queries", async () => {
    vi.useFakeTimers();
    const pending = accessQuery(new Promise(() => {}), "test", "subscription_metadata");
    const assertion = expect(pending).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    await vi.advanceTimersByTimeAsync(3001);
    await assertion;
  });
  it("really cancels an access query when the provider supports AbortSignal", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const operation = Object.assign(new Promise(() => {}), { abortSignal: vi.fn((next: AbortSignal) => { signal = next; return operation; }) });
    const observed = accessQuery(operation, "test", "profile").catch(() => null);
    await vi.advanceTimersByTimeAsync(3001); await observed;
    expect(signal?.aborted).toBe(true);
    expect(operation.abortSignal).toHaveBeenCalledTimes(1);
  });
  it("keeps guards fail-closed and removes hard redirects/reloads on errors", () => {
    const main = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
    expect(main).not.toContain("window.location.href");
    expect(main).toContain('"SERVICE_UNAVAILABLE"');
    for (const path of ["components/SubscriptionGuard.tsx", "components/admin/AdminGuard.tsx", "App.tsx"]) {
      const source = readFileSync(new URL(`../client/src/${path}`, import.meta.url), "utf8");
      expect(source).not.toContain("window.location.reload()");
      expect(source).toContain("authError");
    }
  });
});
