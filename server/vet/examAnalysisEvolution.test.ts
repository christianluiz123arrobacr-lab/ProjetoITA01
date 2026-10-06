import { describe, expect, it } from "vitest";
import {
  buildExamAnalysis,
  examAnalysisBankLink,
  examAnalysisFiltersSchema,
  type ExamAnalysisRow,
} from "../../shared/vet/examAnalysis";
import { parseQuestionBankUrlFilters } from "../../shared/questionBankUrlFilters";
const row = (
  id: string,
  ano: number | null,
  conteudos = ["Dinâmica"]
): ExamAnalysisRow => ({
  id,
  publicada: true,
  instituição: "ITA",
  disciplina: "Física",
  banca: "ITA",
  ano,
  conteudos,
});
describe("Evolução da análise das provas", () => {
  it("valida intervalos e elimina os incompatíveis com filtros dependentes", () => {
    expect(
      examAnalysisFiltersSchema.safeParse({ period: { from: 2025, to: 2020 } })
        .success
    ).toBe(false);
    const data = buildExamAnalysis(
      [row("a", 2020), row("b", 2021), row("c", 2025)],
      { period: { from: 2020, to: 2021 } }
    );
    expect(data.total).toBe(2);
    expect(
      buildExamAnalysis([row("a", 2020)], { period: { from: 2020, to: 2021 } })
        .filters.period
    ).toBeUndefined();
  });
  it("distribui peso um por questão, deduplica tags e não confunde participação com incidência", () => {
    const a = row("a", 2020, ["Dinâmica", "Dinâmica", "Óptica"]);
    const data = buildExamAnalysis([a, a, row("b", 2021, ["Óptica"])]);
    expect(data.total).toBe(2);
    expect(data.distribution.find(c => c.key === "Óptica")).toMatchObject({
      share: 75,
      percent: 100,
      count: 2,
      weight: 1.5,
    });
    expect(data.distribution.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(
      100
    );
  });
  it("inclui conteúdo não informado e conserva todos os membros de Outros", () => {
    const data = buildExamAnalysis([
      ...Array.from({ length: 29 }, (_, i) => row(String(i), 2020)),
      row("other", 2020, ["Óptica"]),
      row("missing", 2020, []),
    ]);
    expect(data.donut.find(c => c.key === "__others__")?.members).toEqual(
      expect.arrayContaining(["Óptica", "__not_informed__"])
    );
    expect(data.donut.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(100);
  });
  it("preserva a maior fatia mesmo quando todas são pequenas", () => {
    const data = buildExamAnalysis(
      Array.from({ length: 30 }, (_, i) =>
        row(String(i), 2020, ["Conteúdo " + i])
      )
    );
    expect(data.donut).toHaveLength(2);
    expect(data.donut[0].members).toHaveLength(1);
    expect(data.donut[1].members).toHaveLength(29);
  });
  it("distingue lacuna, zero real e ano desconhecido", () => {
    const data = buildExamAnalysis(
      [row("a", 2020), row("b", 2022, ["Óptica"]), row("c", null)],
      { content: "Dinâmica" }
    );
    expect(data.unknownYearCount).toBe(1);
    expect(data.contentSeries.find(s => s.key === "Dinâmica")?.points).toEqual([
      { year: 2020, denominator: 1, count: 1, percent: 100 },
      { year: 2021, denominator: 0, count: null, percent: null },
      { year: 2022, denominator: 1, count: 0, percent: 0 },
    ]);
  });
  it("calcula diferenças em pontos percentuais e exibe bases distintas", () => {
    const data = buildExamAnalysis(
      [row("a", 2020), row("b", 2020, ["Óptica"]), row("c", 2022)],
      { compareA: { from: 2020, to: 2020 }, compareB: { from: 2022, to: 2022 } }
    );
    expect(data.comparisons.find(c => c.key === "Dinâmica")).toMatchObject({
      a: { count: 1, denominator: 2, percent: 50 },
      b: { count: 1, denominator: 1, percent: 100 },
      difference: 50,
    });
    expect(data.growth?.key).toBe("Dinâmica");
    expect(data.reduction?.key).toBe("Óptica");
  });
  it("não destaca tendência quando um dos intervalos contém lacuna", () => {
    const data = buildExamAnalysis(
      [row("a", 2020), row("b", 2022, ["Óptica"]), row("c", 2023)],
      { compareA: { from: 2020, to: 2022 }, compareB: { from: 2023, to: 2023 } }
    );
    expect(data.growth).toBeNull();
    expect(data.reduction).toBeNull();
  });
  it("assuntos usam vínculos reais e denominador anual global", () => {
    const data = buildExamAnalysis(
      [
        {
          ...row("a", 2020),
          assuntos_por_conteudo: { Dinâmica: ["Leis de Newton"] },
        },
        row("b", 2020, ["Óptica"]),
        {
          ...row("c", 2020, ["Dinâmica", "Óptica"]),
          assuntos: ["Não associar"],
        },
      ],
      { content: "Dinâmica" }
    );
    expect(data.topicSeries).toHaveLength(1);
    expect(data.topicSeries[0].points[0]).toMatchObject({
      count: 1,
      denominator: 3,
    });
    expect(data.topicSeries[0].points[0].percent).toBeCloseTo(100 / 3);
    expect(data.unmappedTopicQuestions).toBe(1);
  });
  it("transporta e valida instituição, disciplina, banca, conteúdo, assunto e intervalo", () => {
    const url = examAnalysisBankLink({
      institution: "ITA",
      subject: "Física",
      exam: "Exército",
      content: "Dinâmica",
      topic: "Leis de Newton",
      period: { from: 2020, to: 2025 },
    });
    const parsed = parseQuestionBankUrlFilters(url.split("?")[1]);
    expect(parsed).toMatchObject({
      institution: "ITA",
      subjects: ["Física"],
      exam: "Exército",
      topics: ["Dinâmica"],
      subtopics: ["Leis de Newton"],
      interval: { from: 2020, to: 2025 },
    });
    expect(
      parseQuestionBankUrlFilters(
        "?yearFrom=2025&yearTo=2020&years=2025,NaN,-2"
      )
    ).toMatchObject({ years: ["2025"], interval: undefined });
  });
  it("preserva links antigos e não decodifica duas vezes nem aceita marcação", () => {
    expect(
      parseQuestionBankUrlFilters(
        "?topics=Raz%C3%A3o%25&subject=Matem%C3%A1tica"
      )
    ).toMatchObject({ topics: ["Razão%"], subjects: ["Matemática"] });
    expect(
      parseQuestionBankUrlFilters("?institution=%3Cscript%3E")
    ).toMatchObject({ institution: "" });
  });
});
