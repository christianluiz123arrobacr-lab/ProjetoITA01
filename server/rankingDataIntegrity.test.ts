import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(
  new URL("./routers.ts", import.meta.url),
  "utf8"
);
const rankingPageSource = readFileSync(
  new URL("../client/src/pages/RankingPage.tsx", import.meta.url),
  "utf8"
);

function getRankingProcedure(source: string) {
  const start = source.indexOf("getRankingData: publicProcedure");
  const end = source.indexOf("getPublicProfile: publicProcedure", start);

  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("integridade dos dados do ranking", () => {
  const procedure = getRankingProcedure(routerSource);

  it("preserva question_id entre a consulta e a resposta pública", () => {
    expect(procedure).toContain(
      '.select("user_id,question_id,is_correct,time_spent_seconds,answered_at,subject,difficulty")'
    );
    expect(procedure).toContain("attempt.question_id");
    expect(procedure).toContain("question_id: group.question_id");
  });

  it("mantém o identificador necessário para pontuar apenas questões únicas", () => {
    expect(rankingPageSource).toContain("if (!attempt.question_id) continue;");
    expect(rankingPageSource).toContain(
      "uniqueCorrectByQuestion.set(attempt.question_id, attempt)"
    );
  });
});
