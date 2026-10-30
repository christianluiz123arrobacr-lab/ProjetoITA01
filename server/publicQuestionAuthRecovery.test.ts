import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ context: vi.fn(), record: vi.fn(), limit: vi.fn() }));
vi.mock("./_core/context.js", () => ({ createContext: mocks.context }));
vi.mock("./_core/rateLimit.js", () => ({ assertRateLimit: mocks.limit }));
vi.mock("./publicQuestions.js", () => ({ registerPublicQuestionAttempt: mocks.record }));
import session from "../api/public-question/session";
import register from "../api/public-question/register";

const userId = "10000000-0000-4000-8000-000000000001";
const response = () => ({ statusCode: 200, body: "", setHeader: vi.fn(), end(value: string) { this.body = value; } });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.limit.mockResolvedValue(undefined);
  mocks.record.mockResolvedValue({ attemptId: "synthetic-attempt" });
});

describe("public-question API auth classification", () => {
  it.each(["missing", "invalid", "unavailable"])("session %s fails closed with the right HTTP status", async status => {
    mocks.context.mockResolvedValue({ user: null, authentication: { status } });
    const res = response();
    await session({ method: "GET" } as any, res as any);
    expect(res.statusCode).toBe(status === "unavailable" ? 503 : 401);
    expect(JSON.parse(res.body).authenticated).toBe(false);
    expect(res.setHeader).not.toHaveBeenCalledWith("Set-Cookie", expect.anything());
  });
  it.each(["missing", "invalid", "unavailable"])("registration %s never enters the rate limiter or writes an attempt", async status => {
    mocks.context.mockResolvedValue({ user: null, authentication: { status } });
    const res = response();
    await register({ method: "POST", body: { userId: "other-user" } } as any, res as any);
    expect(res.statusCode).toBe(status === "unavailable" ? 503 : 401);
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it.each(["student", "editor", "admin"])("a verified %s registers only for the server identity", async role => {
    mocks.context.mockResolvedValue({ user: { id: userId, role }, authentication: { status: "verified" } });
    const res = response();
    await register({ method: "POST", body: { userId: "forged-user", slug: "synthetic-slug", selectedOption: "A", timeSpentSeconds: 60 } } as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(mocks.record).toHaveBeenCalledWith(userId, "synthetic-slug", "a", 60);
    expect(mocks.limit).toHaveBeenCalledTimes(1);
  });
  it("a verified session can be recognized without returning role or identity", async () => {
    mocks.context.mockResolvedValue({ user: { id: userId, role: "student" }, authentication: { status: "verified" } });
    const res = response();
    await session({ method: "GET" } as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ authenticated: true });
  });
  it("checks methods before authenticating", async () => {
    const res = response();
    await session({ method: "POST" } as any, res as any);
    expect(res.statusCode).toBe(405);
    await register({ method: "GET" } as any, res as any);
    expect(res.statusCode).toBe(405);
    expect(mocks.context).not.toHaveBeenCalled();
  });
});
