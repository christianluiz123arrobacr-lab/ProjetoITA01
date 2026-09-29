import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assertPlatformAccess, getPlatformAccessDecision } from "../_core/platformAccess.js";

function accessClient(profile: { role: string; ativo: boolean } | null, subscription: boolean, rpcError = false) {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: profile, error: null }) };
  return { from: () => query, rpc: async () => ({ data: subscription, error: rpcError ? new Error("indisponível") : null }) } as never;
}

describe("canonical platform access", () => {
  it("guards the published endpoint before its slug query", () => {
    const source = readFileSync(new URL("./lessonRouter.ts", import.meta.url), "utf8");
    const trpc = readFileSync(new URL("../_core/trpc.ts", import.meta.url), "utf8");
    expect(source).toContain("published: platformAccessProcedure");
    expect(source).not.toContain("published: protectedProcedure");
    expect(trpc).toContain("platformAccessProcedure = protectedProcedure.use");
  });
  it("allows admin without requiring a student subscription", async () => expect((await getPlatformAccessDecision({ id: "admin", role: "admin" }, accessClient(null, false))).allowed).toBe(true));
  it("denies an inactive profile even with an active subscription", async () => expect((await getPlatformAccessDecision({ id: "student", role: "student" }, accessClient({ role: "student", ativo: false }, true))).allowed).toBe(false));
  it("allows only an enabled student with active subscription", async () => expect((await getPlatformAccessDecision({ id: "student", role: "student" }, accessClient({ role: "student", ativo: true }, true))).allowed).toBe(true));
  it("returns a generic FORBIDDEN without lesson metadata", async () => {
    await expect(assertPlatformAccess({ id: "student", role: "student" }, accessClient({ role: "student", ativo: true }, false))).rejects.toMatchObject({ code: "FORBIDDEN", message: "É necessário ter acesso ativo à plataforma." } satisfies Partial<TRPCError>);
  });
});
