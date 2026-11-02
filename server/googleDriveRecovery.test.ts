import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: db }));
import { encryptGoogleToken, googleDriveStatus, listNotebooks } from "./googleDrive/googleDriveService";

const userId = "10000000-0000-4000-8000-000000000001";
let results: Array<{ data: unknown; error: unknown }>;
let predicates: unknown[][];
const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  vi.stubEnv("GOOGLE_DRIVE_CLIENT_ID", "synthetic-client");
  vi.stubEnv("GOOGLE_DRIVE_CLIENT_SECRET", "synthetic-secret");
  results = [{ data: { user_id: userId, encrypted_refresh_token: encryptGoogleToken("private-refresh-token"), appdata_enabled_at: "2026-01-01" }, error: null }];
  predicates = [];
  db.from.mockImplementation(() => {
    const q: any = {
      select: () => q,
      eq: (...args: unknown[]) => { predicates.push(args); return q; },
      maybeSingle: () => q,
      abortSignal: () => q,
      then: (resolve: any, reject: any) => Promise.resolve(results.length > 1 ? results.shift() : results[0]).then(resolve, reject),
    };
    return q;
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockImplementation(async (url: string) => Response.json(url.includes("oauth2") ? { access_token: "private-access-token" } : { files: [] }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Drive credential recovery (local provider responses)", () => {
  it("renews a valid grant and keeps every lookup scoped to the authenticated user", async () => {
    expect(await listNotebooks(userId)).toEqual([]);
    expect(predicates).toEqual([["user_id", userId]]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].body.get("grant_type")).toBe("refresh_token");
  });
  it("an absent saved connection requires reconnecting without contacting Google", async () => {
    results = [{ data: null, error: null }];
    await expect(listNotebooks(userId)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("a failed connection lookup is unavailable, not a disconnected account", async () => {
    results = [{ data: null, error: { code: "database_unavailable", message: "private-refresh-token" } }];
    await expect(listNotebooks(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    [503, "invalid_grant"], [500, "server_error"], [429, "rate_limit_exceeded"], [400, "invalid_client"], [401, "unknown"],
  ])("HTTP %s/%s is temporary and does not revoke the saved connection", async (status, error) => {
    fetchMock.mockResolvedValueOnce(Response.json({ error, error_description: "private-refresh-token" }, { status }));
    await expect(listNotebooks(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.objectContaining({ event: "google_drive_token", outcome: "unavailable", http_status: status }));
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("private-refresh-token");
  });
  it("a definite invalid_grant reports reconnection but preserves the encrypted row", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: "invalid_grant" }, { status: 400 }));
    const saved = results[0].data;
    await expect(listNotebooks(userId)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(results[0].data).toBe(saved);
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it.each(["network", "invalid_json", "empty_token"])("handles %s without requesting a new grant", async failure => {
    if (failure === "network") fetchMock.mockRejectedValueOnce(new Error("private-refresh-token"));
    if (failure === "invalid_json") fetchMock.mockResolvedValueOnce(new Response("invalid", { status: 200 }));
    if (failure === "empty_token") fetchMock.mockResolvedValueOnce(Response.json({ access_token: "" }));
    await expect(listNotebooks(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("private-refresh-token");
  });
  it("bounds stalled token renewal, aborts the request, and does not retry", async () => {
    vi.useFakeTimers();
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    const pending = expect(listNotebooks(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    await vi.advanceTimersByTimeAsync(6001);
    await pending;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("does not return a disconnected status after a failed legacy schema fallback", async () => {
    results = [{ data: null, error: { code: "42703" } }, { data: null, error: { code: "connection_error" } }];
    await expect(googleDriveStatus(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("preserves a successful legacy connection status and reconnect instruction", async () => {
    results = [{ data: null, error: { code: "42703" } }, { data: { google_account_email: null }, error: null }];
    expect(await googleDriveStatus(userId)).toEqual({ connected: true, accountEmail: null, requiresReconnect: true });
  });
});
