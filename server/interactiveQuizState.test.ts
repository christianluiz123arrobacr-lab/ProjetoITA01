import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const quiz = readFileSync(
  new URL("../client/src/components/InteractiveQuiz.tsx", import.meta.url),
  "utf8"
);
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

function sliceBetween(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("estado e derivações do InteractiveQuiz", () => {
  it("reinicia respostas, resultados, resoluções e erros sem descartar estatísticas agregadas", () => {
    const restart = sliceBetween(
      quiz,
      "const handleRestart = () => {",
      "if (!questions.length)"
    );

    expect(restart).toContain("setAnswersByQuestion({})");
    expect(restart).toContain("setAnswerResultsByQuestion({})");
    expect(restart).toContain("setResolutionByQuestion({})");
    expect(restart).toContain('setAnswerError("")');
    expect(restart).not.toContain("setAnswerStatsByQuestionId({})");
  });

  it("estabiliza loadAnswerStats e declara a função nas dependências do efeito", () => {
    expect(quiz).toContain("const loadAnswerStats = useCallback(");
    expect(quiz).toContain("}, [trpcUtils]);");
    expect(quiz).toContain(
      "[answered, answerStatsByQuestionId, loadAnswerStats, question?.id]"
    );
  });

  it("não recalcula completionData quando muda somente a alternativa selecionada", () => {
    const completion = sliceBetween(
      quiz,
      "const completionData = useMemo",
      "useEffect(() => {"
    );

    expect(completion).not.toContain("const selected =");
    expect(completion).not.toContain("answersByQuestion,");
    expect(completion).toContain("answerResultsByQuestion");
  });

  it("memoiza o conteúdo rico, mas mantém o cálculo trivial do progresso simples", () => {
    expect(quiz).toContain("const questionContent = useMemo(");
    expect(quiz).toContain("groupRichQuestionContent(buildQuestionRichContent(question))");
    expect(quiz).toContain("const progressPercentage =");
    expect(quiz).not.toContain("const progressPercentage = useMemo");
  });

  it("preserva o contrato canônico do backend para tentativas", () => {
    const procedure = sliceBetween(
      router,
      "recordAttempt: protectedProcedure",
      "getMyAttempts: protectedProcedure"
    );

    expect(procedure).toContain('selectedOption: z.enum(["a", "b", "c", "d", "e"])');
    expect(procedure).not.toContain("isCorrect: z.boolean()");
    expect(procedure).toContain('rpc("record_canonical_question_attempt"');
    expect(procedure).toContain("isCorrect: result.is_correct");
    expect(procedure).toContain("resolution: result.resolution ?? []");
  });
});
