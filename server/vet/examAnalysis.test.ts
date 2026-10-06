import { describe, expect, it } from "vitest";
import {
  buildExamAnalysis,
  examAnalysisBankLink,
  MISSING_ANALYSIS_VALUE,
  type ExamAnalysisRow,
} from "../../shared/vet/examAnalysis";

const row = (
  id: string,
  overrides: Partial<ExamAnalysisRow> = {}
): ExamAnalysisRow => ({
  id,
  publicada: true,
  instituição: "ITA",
  disciplina: "Física",
  banca: "ITA",
  ano: 2023,
  conteudos: ["Mecânica"],
  assuntos: ["Cinemática"],
  ...overrides,
});
const sample = [
  row("one", {
    conteudos: ["Mecânica", "Mecânica", "Ondas"],
    assuntos_por_conteudo: [
      { conteudo: "Mecânica", assuntos: ["Cinemática", "Cinemática"] },
      { conteudo: "Ondas", assuntos: ["Som"] },
    ],
  }),
  row("two", { ano: 2025, conteudos: ["Ondas"], assuntos: ["Som"] }),
  row("three", {
    instituição: "EsPCEx",
    disciplina: "Matemática",
    banca: "Exército",
    conteudos: ["Álgebra"],
    assuntos: ["Equações"],
  }),
  row("private", { publicada: false, instituição: "Não pública" }),
];

describe("Análise das provas: questões distintas e taxonomia canônica", () => {
  it("deriva opções apenas dos registros publicados e combina instituição, disciplina, banca e ano", () => {
    const result = buildExamAnalysis(sample, {
      institution: "ITA",
      subject: "Física",
      exam: "ITA",
      year: 2023,
    });
    expect(result.options.institutions.map(option => option.label)).toEqual([
      "EsPCEx",
      "ITA",
    ]);
    expect(result.options.subjects.map(option => option.label)).toEqual([
      "Física",
    ]);
    expect(result.options.years).toEqual([2023, 2025]);
    expect(result.total).toBe(1);
    expect(result.options.exams.map(option => option.label)).toEqual(["ITA"]);
  });
  it("limpa seleções incompatíveis ao mudar de instituição", () => {
    expect(
      buildExamAnalysis(sample, {
        institution: "EsPCEx",
        subject: "Física",
        exam: "ITA",
        year: 2025,
      }).filters
    ).toEqual({ institution: "EsPCEx" });
  });
  it("conta um ID uma vez e tags repetidas uma vez, mesmo com conteúdos sobrepostos", () => {
    const result = buildExamAnalysis([...sample, sample[0]], {
      institution: "ITA",
    });
    expect(result.total).toBe(2);
    expect(result.multiContent).toBe(true);
    expect(
      result.contents.find(content => content.key === "Ondas")
    ).toMatchObject({ count: 2, denominator: 2, percent: 100 });
    expect(
      result.contents.find(content => content.key === "Mecânica")
    ).toMatchObject({ count: 1, denominator: 2, percent: 50 });
  });
  it("mantém denominador anual da disciplina ao selecionar conteúdo e assunto", () => {
    const result = buildExamAnalysis([...sample, row("four")], {
      institution: "ITA",
      subject: "Física",
      content: "Ondas",
      topic: "Som",
    });
    expect(result.byYear).toEqual([
      { year: 2023, count: 1, denominator: 2, percent: 50 },
      { year: 2025, count: 1, denominator: 1, percent: 100 },
    ]);
    expect(result.topics).toEqual([
      { key: "Som", label: "Som", count: 2, denominator: 2, percent: 100 },
    ]);
  });
  it("usa relações explícitas e não inventa a associação de assuntos de questões multiconteúdo", () => {
    const result = buildExamAnalysis(
      [sample[0], row("flat", { conteudos: ["Mecânica", "Ondas"] })],
      { content: "Mecânica" }
    );
    expect(result.topics.map(topic => topic.key)).toEqual(["Cinemática"]);
    expect(result.unmappedTopicQuestions).toBe(1);
    expect(result.topics[0].percent).toBe(50);
  });
  it("reconhece assuntos compartilhados e vínculos em objeto", () => {
    const result = buildExamAnalysis(
      [
        row("mapped", {
          conteudos: ["Mecânica", "Ondas"],
          assuntos_por_conteudo: {
            Mecânica: ["Oscilações"],
            Ondas: ["Oscilações"],
          },
        }),
      ],
      { content: "Ondas" }
    );
    expect(result.hasSharedTopics).toBe(true);
    expect(result.topics[0].label).toBe("Oscilações");
  });
  it("indica anos ausentes como lacuna, sem criar contagens zero", () => {
    const result = buildExamAnalysis(sample, { institution: "ITA" });
    expect(result.gaps).toEqual([{ from: 2024, to: 2024 }]);
    expect(result.byYear.map(item => item.year)).toEqual([2023, 2025]);
  });
  it("trata listas vazias e campos nulos sem inventar questões", () => {
    const empty = buildExamAnalysis([]);
    expect(empty.total).toBe(0);
    expect(empty.contents).toEqual([]);
    expect(empty.options.years).toEqual([]);
    const missing = buildExamAnalysis([
      row("null", {
        instituição: null,
        disciplina: null,
        banca: null,
        ano: null,
        conteudos: null,
        assuntos: null,
      }),
    ]);
    expect(missing.options.institutions[0]).toEqual({
      value: MISSING_ANALYSIS_VALUE,
      label: "Não informado",
    });
    expect(missing.unknownYearCount).toBe(1);
    expect(missing.contents[0].label).toBe("Não informado");
    expect(missing.byYear).toEqual([]);
  });
  it("usa somente filtros suportados pela rota existente do banco", () => {
    const url = new URL(
      examAnalysisBankLink({
        institution: "ITA",
        subject: "Física",
        content: "Mecânica",
        topic: "Cinemática",
        exam: "ITA",
        year: 2025,
      }),
      "https://local.test"
    );
    expect(url.pathname).toBe("/banco-de-questoes");
    expect([...url.searchParams.keys()]).toEqual([
      "institution",
      "subject",
      "topics",
      "subtopics",
      "exam",
      "years",
    ]);
    expect(url.searchParams.get("topics")).toBe("Mecânica");
  });
  it("restringe as disciplinas aos demais filtros e identifica assunto realmente ausente", () => {
    expect(
      buildExamAnalysis(sample, { year: 2025 }).options.subjects.map(
        option => option.label
      )
    ).toEqual(["Física"]);
    const result = buildExamAnalysis(
      [row("missing-topic", { assuntos: null, assunto: null })],
      { content: "Mecânica" }
    );
    expect(result.topics[0]).toMatchObject({
      label: "Não informado",
      count: 1,
      percent: 100,
    });
  });
});
