import type { Session } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../client/src/lib/supabase", () => ({ supabase: { auth: {} } }));
import { createSessionController } from "../client/src/lib/authSession";
import { createAuthenticatedFetch, isProvenInvalidResponse } from "../client/src/lib/trpcTransport";

const session = (token = "test-token") => ({ access_token: token, user: { id: "test-user" } }) as Session;
function setup() {
  let callback: (event: string, session: Session | null) => void = () => {};
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: session() }, error: null }),
    onAuthStateChange: vi.fn(fn => { callback = fn; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
  const controller = createSessionController(auth as never);
  return { auth, controller, emit: (value: Session | null) => callback("TOKEN_REFRESHED", value) };
}
describe("bounded client session and transport (no real provider)", () => {
  beforeEach(() => { vi.spyOn(console, "warn").mockImplementation(() => {}); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it("shares one pending read and attaches a valid token", async () => {
    const { auth, controller } = setup();
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json" } }));
    const fetch = createAuthenticatedFetch(controller, fetcher);
    await Promise.all([controller.getSession(), fetch("https://example.test/api")]);
    expect(auth.getSession).toHaveBeenCalledTimes(1);
    expect(new Headers(fetcher.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer test-token");
    expect(controller.getSnapshot()).toMatchObject({ loading: false, error: null });
  });
  it("a failed session load never sends an unauthenticated request or signs out", async () => {
    const { auth, controller } = setup();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: { message: "temporary failure private@example.test" } } as never);
    const fetcher = vi.fn();
    await expect(createAuthenticatedFetch(controller, fetcher)("https://example.test")).rejects.toThrow("Não foi possível carregar");
    expect(controller.getSnapshot()).toMatchObject({ loading: false, session: null });
    expect(fetcher).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("private@example");
    auth.getSession.mockResolvedValue({ data: { session: session() }, error: null });
    await controller.retry();
    expect(controller.getSnapshot().error).toBeNull();
  });
  it("a rejected getSession promise ends loading", async () => {
    const { auth, controller } = setup();
    auth.getSession.mockRejectedValue(new Error("network"));
    await expect(controller.getSession()).rejects.toThrow();
    expect(controller.getSnapshot().loading).toBe(false);
  });
  it("an empty INITIAL_SESSION event cannot conceal a session read failure", async () => {
    const { auth, controller } = setup();
    auth.getSession.mockRejectedValue(new Error("provider unavailable"));
    const pending = controller.getSession();
    auth.onAuthStateChange.mock.calls[0][0]("INITIAL_SESSION", null);
    await expect(pending).rejects.toThrow("Não foi possível carregar");
    expect(controller.getSnapshot()).toMatchObject({ loading: false, session: null });
    expect(controller.getSnapshot().error).not.toBeNull();
  });
  it("times out session loading without polling", async () => {
    vi.useFakeTimers();
    const { auth, controller } = setup();
    auth.getSession.mockReturnValue(new Promise(() => {}));
    const assertion = expect(controller.getSession()).rejects.toThrow("Não foi possível carregar");
    await vi.advanceTimersByTimeAsync(8001);
    await assertion;
    expect(controller.getSnapshot().loading).toBe(false);
    await vi.advanceTimersByTimeAsync(60000);
    expect(auth.getSession).toHaveBeenCalledTimes(1);
  });
  it("bounds and aborts hung tRPC fetch", async () => {
    vi.useFakeTimers();
    const { controller } = setup();
    const fetcher = vi.fn().mockImplementation(() => new Promise(() => {}));
    const assertion = expect(createAuthenticatedFetch(controller, fetcher)("https://example.test")).rejects.toThrow("prazo");
    await vi.advanceTimersByTimeAsync(25001);
    await assertion;
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it("missing token stays unauthenticated, not temporarily failing", async () => {
    const { auth, controller } = setup();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await controller.getSession()).toBeNull();
    expect(controller.getSnapshot()).toEqual({ session: null, loading: false, error: null });
  });
  it("503 or an unclassified 401 does not end a valid local session", async () => {
    const { auth, controller } = setup();
    for (const status of [503, 401]) {
      const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ error: { json: { data: { code: "UNAUTHORIZED", authStatus: "unavailable" } } } }]), { status, headers: { "content-type": "application/json" } }));
      await createAuthenticatedFetch(controller, fetcher)("https://example.test");
    }
    expect(controller.getSnapshot().session).not.toBeNull();
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(isProvenInvalidResponse([{ error: { json: { data: { code: "UNAUTHORIZED", authStatus: "missing" } } } }])).toBe(false);
  });
  it("proven invalid token is removed once; stale SDK events cannot cause a login bounce", async () => {
    const { auth, controller, emit } = setup();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ error: { json: { data: { code: "UNAUTHORIZED", authStatus: "invalid" } } } }]), { status: 401, headers: { "content-type": "application/json" } }));
    await createAuthenticatedFetch(controller, fetcher)("https://example.test");
    expect(controller.getSnapshot().session).toBeNull();
    emit(session());
    expect(controller.getSnapshot().session).toBeNull();
    await controller.rejectInvalidToken("test-token");
    expect(auth.signOut).toHaveBeenCalledTimes(1);
    emit(session("new-token"));
    await controller.rejectInvalidToken("test-token");
    expect(controller.getSnapshot().session?.access_token).toBe("new-token");
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });
});
