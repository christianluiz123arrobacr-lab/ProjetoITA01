import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { getQuestionsWithoutResolution, summarizeAttempts } from "../shared/statistics";
import { fetchAllQuestionPages } from "./questions/questionPagination";

describe("estatísticas canônicas", () => {
  it("conta questões distintas sem resolução legível, sem confundir blocos com questões", () => {
    const questions = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const blocks = [
      { questao_id: "a", tipo: "texto", texto: "Passo 1" },
      { questao_id: "a", tipo: "latex", texto: "x=1" },
      { questao_id: "b", tipo: "imagem", url_imagem: null },
      { questao_id: "órfã", tipo: "texto", texto: "Outro" },
    ];
    expect(getQuestionsWithoutResolution(questions, blocks)).toEqual([{ id: "b" }, { id: "c" }]);
  });

  it("separa tentativas, questões distintas, acertos únicos e taxa por tentativa", () => {
    expect(summarizeAttempts([
      { question_id: "a", is_correct: false },
      { question_id: "a", is_correct: true },
      { question_id: "a", is_correct: true },
      { question_id: "b", is_correct: false },
    ])).toEqual({ totalAttempts: 4, distinctAnswered: 2, distinctCorrect: 1, correctAttempts: 2, accuracy: 50 });
  });

  it("pagina além do limite padrão do PostgREST", async () => {
    const source = Array.from({ length: 1203 }, (_, id) => ({ id }));
    const rows = await fetchAllQuestionPages(async (from, to) => source.slice(from, to + 1));
    expect(rows).toHaveLength(1203);
    expect(rows.at(-1)?.id).toBe(1202);
  });

  it("não devolve zeros fixos na lista administrativa e protege o registro de acesso", () => {
    const source = readFileSync("server/routers.ts", "utf8");
    const students = source.split("listStudentsWithBilling: adminProcedure")[1]?.split("getBillingConsistencyReport:")[0] ?? "";
    const access = source.split("getAccessStatus: protectedProcedure")[1]?.split("getAccessStatus:")[0] ?? "";
    expect(students).toContain("summarizeAttempts(userAttempts)");
    expect(students).toContain("attempts_count: attemptStats.totalAttempts");
    expect(students).not.toContain("attempts_count: 0");
    expect(access).toContain('.eq("id", ctx.user.id)');
    expect(access).toContain("last_seen_at.lt.");
  });

  it("mantém o fluxo novo de importação com salvamento de blocos e compensação em falha", () => {
    const source = readFileSync("server/routers.ts", "utf8");
    const importer = source.split("async function executePreparedQuestionImport")[1]?.split("const createdCount")[0] ?? "";
    expect(importer).toContain("saveImportedResolutionBlocks(data.id, question.resolucao_blocos)");
    expect(importer).toContain('.from("questoes").delete().eq("id", data.id)');
  });
});
