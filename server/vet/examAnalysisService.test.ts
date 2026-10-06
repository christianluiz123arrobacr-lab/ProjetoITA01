import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { getExamAnalysis } from "./examAnalysisService";
import { platformAccessProcedure, router } from "../_core/trpc";
import { examAnalysisFiltersSchema } from "../../shared/vet/examAnalysis";
import { readFileSync } from "node:fs";

const mocks = vi.hoisted(() => ({ range: vi.fn(), access: vi.fn() }));
vi.mock("../_core/platformAccess.js", () => ({
  assertPlatformAccess: mocks.access,
}));
vi.mock("../_core/supabaseAdmin.js", () => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: mocks.range,
  };
  return { supabaseAdmin: { from: vi.fn(() => chain) } };
});
const api = router({
  getExamAnalysis: platformAccessProcedure
    .input(examAnalysisFiltersSchema)
    .query(({ input }) => getExamAnalysis(input)),
});
const context = (user: unknown) => ({ user, req: {}, res: {} }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.access.mockResolvedValue(undefined);
});

describe("API de análise: cobertura e acesso", () => {
  it("pagina além do limite padrão e não retorna IDs nem conteúdo privado", async () => {
    mocks.range.mockImplementation(async (from: number, to: number) => ({
      data: Array.from(
        { length: Math.max(0, Math.min(to + 1, 1201) - from) },
        (_, index) => ({
          id: String(from + index),
          publicada: true,
          instituição: "ITA",
          disciplina: "Física",
          ano: 2025,
          conteudos: ["Mecânica"],
        })
      ),
      error: null,
    }));
    const result = await getExamAnalysis({});
    expect(result.total).toBe(1201);
    expect(mocks.range.mock.calls).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ]);
    expect(JSON.stringify(result)).not.toContain('"id":');
  });
  it("falha explicitamente se alguma página falhar, sem publicar contagem parcial", async () => {
    mocks.range.mockResolvedValue({
      data: null,
      error: { message: "internal" },
    });
    await expect(getExamAnalysis({})).rejects.toThrow(
      "Não foi possível carregar"
    );
  });
  it("bloqueia usuário sem autenticação antes de consultar o banco", async () => {
    await expect(
      api.createCaller(context(null)).getExamAnalysis({})
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.range).not.toHaveBeenCalled();
  });
  it("exige acesso válido à plataforma antes da consulta e aceita usuário autorizado", async () => {
    mocks.access.mockRejectedValueOnce(new TRPCError({ code: "FORBIDDEN" }));
    const caller = api.createCaller(
      context({ id: "student", role: "student" })
    );
    await expect(caller.getExamAnalysis({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.range).not.toHaveBeenCalled();
    mocks.range.mockResolvedValue({ data: [], error: null });
    await expect(caller.getExamAnalysis({})).resolves.toMatchObject({
      total: 0,
    });
  });
  it("monta o endpoint real com a mesma proteção e a rota dentro do roteador privado", () => {
    const routes = readFileSync(
      new URL("../routers.ts", import.meta.url),
      "utf8"
    );
    expect(routes).toContain(
      "getExamAnalysis: platformAccessProcedure.input(examAnalysisFiltersSchema)"
    );
    const app = readFileSync(
      new URL("../../client/src/App.tsx", import.meta.url),
      "utf8"
    );
    expect(app).toContain(
      '<Route path="/vet/analise-provas" component={VetExamAnalysisPage} />'
    );
    expect(app).toContain("<SubscriptionGuard bypass={isAdminRoute}>");
  });
});
