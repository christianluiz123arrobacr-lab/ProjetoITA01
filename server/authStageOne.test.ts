import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
vi.mock("../client/src/lib/supabase", () => ({ supabase: { auth: {} } }));
import { createSessionController } from "../client/src/lib/authSession";
import { createAuthenticatedFetch, createAuthenticatedTrpcLink } from "../client/src/lib/trpcTransport";
import { createTRPCUntypedClient } from "@trpc/client";
import { evaluateAdminAccess, suspendAdminRequests, ADMIN_RECOVERY_GRACE_MS } from "../client/src/lib/adminRevalidation";

const value = (token = "old", id = "one") => ({ access_token: token, user: { id } }) as Session;
function setup() {
  let emit = (_event: string, _session: Session | null) => {};
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: value() }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(fn => { emit = fn; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
  };
  return { auth, controller: createSessionController(auth as never), emit: (s: Session | null, event = "TOKEN_REFRESHED") => emit(event, s) };
}
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, "warn").mockImplementation(() => {}); vi.spyOn(console, "info").mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it("recovers a transient SDK failure automatically, sharing concurrent callers", async () => {
  const { auth, controller } = setup();
  auth.getSession.mockRejectedValueOnce(new Error("temporary"));
  const calls = Promise.all([controller.getSession(), controller.getSession(), controller.getSession()]);
  // Attach a handler before advancing timers, including on the old broken implementation.
  const observed = calls.then(result => result, () => null);
  await vi.advanceTimersByTimeAsync(3500);
  expect(await observed).toEqual([value(), value(), value()]);
  expect(auth.getSession).toHaveBeenCalledTimes(2);
  expect(controller.getSnapshot().error).toBeNull();
});

it("logout is immediate and cannot be undone by an old pending session read", async () => {
  const { auth, controller } = setup();
  await controller.getSession();
  let resolve!: (v: unknown) => void;
  auth.getSession.mockReturnValueOnce(new Promise(r => { resolve = r; }) as never);
  const pending = controller.getSession();
  await controller.signOut();
  expect(controller.getSnapshot().session).toBeNull();
  resolve({ data: { session: value() }, error: null });
  await pending;
  expect(controller.getSnapshot().session).toBeNull();
});

it("persistent failure stops after three attempts, with no polling, and manual retry recovers", async () => {
  const { auth, controller } = setup();
  auth.getSession.mockRejectedValue(new Error("private data"));
  const observed = controller.getSession().catch(() => null);
  await vi.advanceTimersByTimeAsync(4000); await observed;
  expect(auth.getSession).toHaveBeenCalledTimes(3);
  expect(controller.getSnapshot()).toMatchObject({ loading: false, recovering: false });
  await vi.advanceTimersByTimeAsync(600000);
  await expect(controller.getSession()).rejects.toThrow();
  expect(auth.getSession).toHaveBeenCalledTimes(3);
  auth.getSession.mockResolvedValue({ data: { session: value() }, error: null });
  await Promise.all([controller.retry(), controller.retry()]);
  expect(auth.getSession).toHaveBeenCalledTimes(4);
  expect(controller.getSnapshot().error).toBeNull();
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("private data");
});

it.each([["new", "one"], ["new", "two"]])("a renewal or user switch wins over an old read (%s/%s)", async (token, id) => {
  const { auth, controller, emit } = setup();
  await controller.getSession();
  let resolve!: (v: unknown) => void;
  auth.getSession.mockReturnValueOnce(new Promise(r => { resolve = r; }) as never);
  const pending = controller.getSession();
  emit(value(token, id));
  resolve({ data: { session: value() }, error: null });
  expect(await pending).toEqual(value(token, id));
  expect(controller.getSnapshot().session).toEqual(value(token, id));
});

it("no protected request is sent during authenticated session recovery", async () => {
  const { auth, controller } = setup();
  await controller.getSession();
  auth.getSession.mockRejectedValueOnce(new Error("temporary"));
  const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
  const pending = createAuthenticatedFetch(controller, fetcher)("https://local.test/api/trpc/protected.read");
  await vi.advanceTimersByTimeAsync(500);
  expect(fetcher).not.toHaveBeenCalled();
  expect(controller.getSnapshot().session).toEqual(value());
  await vi.advanceTimersByTimeAsync(501); await pending;
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("a new subscription can recover an exhausted session without a reload", async () => {
  const { auth, controller } = setup();
  const rootSubscription = controller.subscribe(() => {});
  const unsubscribe = controller.subscribe(() => {});
  auth.getSession.mockRejectedValue(new Error("temporary"));
  // The startup read was already issued; fail the subsequent cycle.
  await vi.advanceTimersByTimeAsync(0);
  const observed = controller.getSession().catch(() => null);
  await vi.advanceTimersByTimeAsync(4000); await observed;
  unsubscribe();
  auth.getSession.mockResolvedValue({ data: { session: value() }, error: null });
  const unsubscribeAgain = controller.subscribe(() => {});
  await vi.advanceTimersByTimeAsync(0);
  expect(controller.getSnapshot().error).toBeNull();
  unsubscribeAgain(); rootSubscription(); controller.dispose();
});

it("a proven invalid SDK credential is denied without retry or provider logout", async () => {
  const { auth, controller } = setup();
  auth.getSession.mockResolvedValue({ data: { session: null }, error: { code: "refresh_token_not_found" } } as never);
  expect(await controller.getSession()).toBeNull();
  expect(auth.getSession).toHaveBeenCalledTimes(1);
  expect(controller.getSnapshot()).toMatchObject({ session: null, error: null, loading: false });
});

it("logout cancels recovery timers and ignores stale refresh events", async () => {
  const { auth, controller, emit } = setup();
  await controller.getSession();
  auth.getSession.mockRejectedValue(new Error("temporary"));
  const pending = controller.getSession();
  await vi.advanceTimersByTimeAsync(1);
  await controller.signOut(); await pending;
  emit(value("late-refreshed"));
  expect(controller.getSnapshot().session).toBeNull();
  await vi.advanceTimersByTimeAsync(30000);
  expect(auth.getSession).toHaveBeenCalledTimes(2);
  emit(value("new-login", "two"), "SIGNED_IN");
  expect(controller.getSnapshot().session?.user.id).toBe("two");
});
it("an older SDK logout completion cannot undo a new login", async () => {
  const { auth, controller, emit } = setup();
  await controller.getSession();
  let resolve!: (v: unknown) => void;
  auth.signOut.mockReturnValueOnce(new Promise(r => { resolve = r; }) as never);
  const logout = controller.signOut();
  emit(value("new-login", "two"), "SIGNED_IN");
  emit(null, "SIGNED_OUT");
  resolve({ error: null }); await logout;
  expect(controller.getSnapshot().session?.user.id).toBe("two");
});
it("a stale SDK session read after logout cannot restore even a different refreshed token", async () => {
  const { auth, controller } = setup();
  await controller.getSession(); await controller.signOut();
  auth.getSession.mockResolvedValue({ data: { session: value("late-new-token") }, error: null });
  expect(await controller.getSession()).toBeNull();
  expect(controller.getSnapshot().session).toBeNull();
});

const input = (overrides = {}) => ({ userId: "one", responseUserId: "one", role: "admin", loading: false, failed: false, definitive: false, roles: ["admin", "editor"], now: 0, ...overrides });
it("an unconfirmed administrative entry is never preserved on error", () => {
  expect(evaluateAdminAccess(null, input({ loading: true })).status).toBe("checking");
  expect(evaluateAdminAccess(null, input({ failed: true })).status).toBe("error");
});
it.each(["admin", "editor"])("%s keeps visual confirmation across healthy five-minute revalidation cycles", role => {
  const first = evaluateAdminAccess(null, input({ role }));
  const fetching = evaluateAdminAccess(first.confirmation, input({ role, loading: true, now: 300001 }));
  expect(fetching.status).toBe("allowed");
  expect(evaluateAdminAccess(fetching.confirmation, input({ role, now: 600002 })).status).toBe("allowed");
});
it("visual grace has a fixed deadline and recovery resets it only after confirmation", () => {
  const first = evaluateAdminAccess(null, input());
  const failed = evaluateAdminAccess(first.confirmation, input({ failed: true, now: 300001 }));
  expect(failed.status).toBe("recovering");
  const expired = evaluateAdminAccess(failed.confirmation, input({ failed: true, now: 300001 + ADMIN_RECOVERY_GRACE_MS }));
  expect(expired.status).toBe("error");
  expect(expired.confirmation?.failedAt).toBe(300001);
  expect(evaluateAdminAccess(expired.confirmation, input({ now: 400001 })).confirmation?.failedAt).toBeNull();
});
it("logout, user switch and explicit revocation remove the previous confirmation", () => {
  const first = evaluateAdminAccess(null, input()).confirmation;
  for (const overrides of [{ userId: undefined }, { userId: "two", failed: true }, { definitive: true, failed: true }, { role: "student" }, { roles: ["editor"] }]) {
    expect(evaluateAdminAccess(first, input(overrides)).confirmation).toBeNull();
  }
});
it("editors cannot enter admin-only guards and students cannot enter either", () => {
  expect(evaluateAdminAccess(null, input({ role: "editor", roles: ["admin"] })).status).toBe("blocked");
  expect(evaluateAdminAccess(null, input({ role: "student" })).status).toBe("blocked");
});
it("uncertain admin permissions block protected reads/writes, but permit role recovery", async () => {
  const { controller } = setup(); const owner = Symbol();
  const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
  const fetch = createAuthenticatedFetch(controller, fetcher);
  suspendAdminRequests(owner, "one");
  try {
    await expect(fetch("https://local.test/api/trpc/admin.read")).rejects.toThrow("pausadas");
    await expect(fetch("https://local.test/api/trpc/admin.write", { method: "POST" })).rejects.toThrow("pausadas");
    expect(fetcher).not.toHaveBeenCalled();
    await fetch("https://local.test/api/trpc/auth.me");
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally { suspendAdminRequests(owner, null); }
});
it("access is not held behind a slow unrelated tRPC batch", async () => {
  const { controller } = setup();
  const fetcher = vi.fn(async (url: RequestInfo | URL) => {
    const text = String(url);
    if (text.includes("heavy")) await new Promise(r => setTimeout(r, 5000));
    const entry = { result: { data: { json: true } } };
    return new Response(JSON.stringify(text.includes("batch=1") ? [entry] : entry), { headers: { "content-type": "application/json" } });
  });
  const client = createTRPCUntypedClient({ links: [createAuthenticatedTrpcLink(controller, fetcher)] });
  let heavyDone = false;
  const heavy = client.query("page.heavy").then(() => { heavyDone = true; });
  const access = client.query("auth.me");
  await vi.advanceTimersByTimeAsync(10);
  expect(await access).toBe(true);
  expect(heavyDone).toBe(false);
  expect(fetcher.mock.calls.some(([url]) => String(url).includes("auth.me") && !String(url).includes("heavy"))).toBe(true);
  await vi.advanceTimersByTimeAsync(5000); await heavy;
});
it("an aborted transport leaves shared session recovery available to another caller", async () => {
  const { auth, controller } = setup();
  auth.getSession.mockRejectedValueOnce(new Error("temporary"));
  const cancellation = new AbortController(); const fetcher = vi.fn();
  const request = createAuthenticatedFetch(controller, fetcher)("https://local.test/api/trpc/auth.me", { signal: cancellation.signal }).catch(error => error);
  const session = controller.getSession();
  await vi.advanceTimersByTimeAsync(1); cancellation.abort();
  expect((await request).name).toBe("AbortError");
  expect(fetcher).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1000);
  expect(await session).toEqual(value());
  expect(auth.getSession).toHaveBeenCalledTimes(2);
});
it("concurrent access procedures share a separate batch without unrelated page work", async () => {
  const { controller } = setup();
  const fetcher = vi.fn(async (url: RequestInfo | URL) => {
    const paths = new URL(String(url), "http://local.test").pathname.split("/api/trpc/")[1].split(",");
    return new Response(JSON.stringify(paths.map(() => ({ result: { data: { json: true } } }))), { headers: { "content-type": "application/json" } });
  });
  const client = createTRPCUntypedClient({ links: [createAuthenticatedTrpcLink(controller, fetcher)] });
  const pending = Promise.all([client.query("auth.me"), client.query("auth.getAccessStatus"), client.query("page.heavy")]);
  await vi.advanceTimersByTimeAsync(10); await pending;
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.some(([url]) => String(url).includes("auth.me,auth.getAccessStatus") && !String(url).includes("heavy"))).toBe(true);
});
it("a refreshed SDK token is used instead of cached credentials", async () => {
  const { auth, controller } = setup();
  await controller.getSession();
  auth.getSession.mockResolvedValue({ data: { session: value("fresh") }, error: null });
  const fetcher = vi.fn().mockResolvedValue(new Response("{}"));
  await createAuthenticatedFetch(controller, fetcher)("https://local.test/api/trpc/auth.me");
  expect(new Headers(fetcher.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer fresh");
});
