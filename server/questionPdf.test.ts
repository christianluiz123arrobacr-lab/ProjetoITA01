import { describe, expect, it } from "vitest";
import { QUESTION_PDF_EXPORT_LIMIT, questionPdfFiltersSchema, questionRowMatchesPdfFilters } from "../shared/questionPdf";
import { buildPdfFileName, buildPdfFilterSummary, chunkAnswers, getQuestionPdfTags, planQuestionPages } from "../client/src/lib/questionPdfLayout";
import type { Question } from "../client/src/types/question";

const filters = questionPdfFiltersSchema.parse({ institutions: ["ITA", "AFA"], years: [2025, 2026], subjects: ["fisica"], topics: ["Dinâmica"], difficulties: ["medio"] });
const row = { id: "1", publicada: true, disciplina: "fisica", conteudo: "Dinâmica", assunto: "Forças", instituição: "ITA", ano: 2026, dificuldade: "medio", codigo: "F-1", enunciado: "Calcule $F=ma$" };
const question: Question = { id: "1", subject: "fisica", topic: "Dinâmica", topics: ["Dinâmica"], subtopic: "Forças", institution: "ITA", year: 2026, exam: "ITA", statement: "Calcule $F=ma$", formula: "$$F=ma$$", imageUrl: "https://project.supabase.co/storage/v1/object/public/q/image.png", options: [{ id: "a", label: "A", text: "2 N", imageUrl: "https://project.supabase.co/a.png" }], correctOptionId: "a", difficulty: "medio" };

describe("exportação de questões em PDF", () => {
  it("usa os filtros ativos", () => expect(questionRowMatchesPdfFilters(row, filters)).toBe(true));
  it("rejeita instituição fora do filtro", () => expect(questionRowMatchesPdfFilters({ ...row, instituição: "IME" }, filters)).toBe(false));
  it("considera resultados além da página visível", () => expect(Array.from({ length: 41 }, (_, i) => ({ ...row, id: String(i) })).filter(item => questionRowMatchesPdfFilters(item, filters))).toHaveLength(41));
  it("mantém limite técnico público e configurável", () => expect(QUESTION_PDF_EXPORT_LIMIT).toBe(120));
  it("aceita questão somente com texto", () => expect(getQuestionPdfTags({ ...question, imageUrl: undefined, options: [{ id: "a", label: "A", text: "texto" }] })).toContain("Física"));
  it("preserva referência de imagem do enunciado", () => expect(question.imageUrl).toContain("supabase.co"));
  it("preserva imagem em alternativa", () => expect(question.options[0].imageUrl).toContain("supabase.co"));
  it("preserva conteúdo matemático para renderização", () => expect(question.formula).toContain("F=ma"));
  it("cria etiquetas com instituição, ano e dificuldade", () => expect(getQuestionPdfTags(question)).toEqual(expect.arrayContaining(["ITA", "2026", "Média"])));
  it("omite campos opcionais ausentes", () => expect(getQuestionPdfTags({ ...question, institution: undefined, subtopic: undefined, subtopics: [] })).not.toContain("undefined"));
  it("acomoda mais de uma questão na página", () => expect(planQuestionPages([200, 250], 600)).toEqual([[0, 1]]));
  it("inicia questão grande na página seguinte", () => expect(planQuestionPages([400, 300], 600)).toEqual([[0], [1]]));
  it("gera uma coluna de gabarito até 10 questões", () => expect(chunkAnswers(Array(10).fill("c"))[0]).toHaveLength(1));
  it("gera duas colunas entre 11 e 20 questões", () => expect(chunkAnswers(Array(20).fill("b"))[0]).toHaveLength(2));
  it("mantém o PDF utilizável quando uma questão antiga não possui gabarito", () => expect(chunkAnswers([""])[0][0][0].answer).toBe("—"));
  it("continua o gabarito em outra página acima de 40", () => expect(chunkAnswers(Array(41).fill("a"))).toHaveLength(2));
  it("resume filtros múltiplos sem valores vazios", () => expect(buildPdfFilterSummary(filters)).toContain("Instituição: ITA, AFA"));
  it("descreve seleção sem filtros", () => expect(buildPdfFilterSummary(questionPdfFiltersSchema.parse({}))).toBe("Todas as questões disponíveis para a seleção atual"));
  it("gera nome de arquivo e data estáveis", () => expect(buildPdfFileName(new Date("2026-07-23T12:00:00Z"))).toBe("projeto-vetor-lista-2026-07-23.pdf"));
});
