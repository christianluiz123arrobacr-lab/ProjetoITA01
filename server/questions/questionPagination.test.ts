import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { fetchAllQuestionPages, QUESTION_LIST_BATCH_SIZE } from "./questionPagination";

describe("paginação da listagem pública de questões", () => {
  it("retorna a questão 1.001 e mantém o contrato como array", async () => {
    const source = Array.from({ length: 1_001 }, (_, index) => ({
      id: String(index + 1).padStart(4, "0"),
    }));
    const fetchPage = vi.fn(async (from: number, to: number) => source.slice(from, to + 1));

    const rows = await fetchAllQuestionPages(fetchPage);

    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(1_001);
    expect(rows[1_000]).toEqual({ id: "1001" });
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 499);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 500, 999);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 1_000, 1_499);
  });

  it("continua até receber um lote menor que o tamanho configurado", async () => {
    const fetchPage = vi
      .fn<(from: number, to: number) => Promise<number[]>>()
      .mockResolvedValueOnce(Array.from({ length: QUESTION_LIST_BATCH_SIZE }, (_, index) => index))
      .mockResolvedValueOnce([]);

    await expect(fetchAllQuestionPages(fetchPage)).resolves.toHaveLength(QUESTION_LIST_BATCH_SIZE);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("rejeita tamanho de lote inválido", async () => {
    await expect(fetchAllQuestionPages(async () => [], 0)).rejects.toThrow(
      "Question page size must be a positive integer."
    );
  });

  it("questions.list usa lotes no backend com ordem determinística e preserva filtros", () => {
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    const listStart = router.indexOf("list: publicProcedure");
    const getByIdStart = router.indexOf("getById: publicProcedure", listStart);
    const procedure = router.slice(listStart, getByIdStart);

    expect(procedure).toContain("fetchAllQuestionPages");
    expect(procedure).toContain('.eq("publicada", true)');
    expect(procedure).toContain('.order("created_at", { ascending: false })');
    expect(procedure).toContain('.order("id", { ascending: true })');
    expect(procedure).toContain(".range(from, to)");
    expect(procedure).toContain("return rows.map(safeQuestionDto)");
    expect(procedure).toContain('query.eq("disciplina", input.subject)');
    expect(procedure).toContain('query.eq("banca", input.exam)');
    expect(procedure).toContain('query.eq("instituição", input.institution)');
  });
});
