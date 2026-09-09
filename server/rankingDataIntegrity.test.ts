import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const rankingPage = readFileSync(
  new URL("../client/src/pages/RankingPage.tsx", import.meta.url),
  "utf8"
);

describe("integridade dos dados do ranking", () => {
  it("preserva question_id entre a consulta e o cálculo de questões únicas", () => {
    const start = router.indexOf("getRankingData: publicProcedure");
    const end = router.indexOf("getPublicProfile: publicProcedure", start);
    const procedure = router.slice(start, end);

    expect(procedure).toContain(
      '.select("user_id,question_id,is_correct,time_spent_seconds,answered_at,subject,difficulty")'
    );
    expect(procedure).toContain("attempt.question_id");
    expect(procedure).toContain("question_id: group.question_id");
    expect(rankingPage).toContain("uniqueCorrectByQuestion.get(attempt.question_id)");
  });
});
