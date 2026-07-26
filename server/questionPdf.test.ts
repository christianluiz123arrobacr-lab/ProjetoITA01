import { describe, expect, it } from "vitest";
import { QUESTION_PDF_EXPORT_LIMIT, questionPdfFiltersSchema, questionRowMatchesPdfFilters } from "../shared/questionPdf";
import { buildPdfFileName, buildPdfFilterSummary, chunkAnswers, fitPdfImage, getQuestionPdfTags, planQuestionPages, QUESTION_PDF_LAYOUT } from "../client/src/lib/questionPdfLayout";
import { latexToPdfText, shouldRenderStandaloneFormula } from "../client/src/lib/questionPdfGenerator";
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
  it("reduz imagens grandes sem ampliar imagens pequenas ou deformar a proporção", () => {
    expect(fitPdfImage(1200, 800, QUESTION_PDF_LAYOUT.statementImageMaxWidth, QUESTION_PDF_LAYOUT.statementImageMaxHeight)).toEqual({ width: 427.5, height: 285 });
    expect(fitPdfImage(200, 100, QUESTION_PDF_LAYOUT.optionImageMaxWidth, QUESTION_PDF_LAYOUT.optionImageMaxHeight)).toEqual({ width: 200, height: 100 });
  });
  it("mantém imagens e espaço de resolução nos limites compactos definidos", () => {
    expect(QUESTION_PDF_LAYOUT).toMatchObject({ statementImageMaxWidth: 472, optionImageMaxWidth: 354, resolutionSpaceHeight: 168 });
  });
  it("preserva conteúdo matemático para renderização", () => expect(question.formula).toContain("F=ma"));
  it("cria etiquetas com instituição, ano e dificuldade", () => expect(getQuestionPdfTags(question)).toEqual(expect.arrayContaining(["ITA", "2026", "Média"])));
  it("limita conteúdos nas etiquetas e preserva a ordem essencial", () => {
    expect(getQuestionPdfTags({ ...question, topics: ["Álgebra", "Polinômios", "Funções", "Logaritmos"] }))
      .toEqual(["Física", "Álgebra", "Polinômios", "+2 conteúdos", "ITA", "2026", "Média"]);
  });
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

  it.each([
    [String.raw`$f(x)=x^3+3x^2-4x-12$`, "f(x)=x³+3x²−4x−12"],
    [String.raw`$\frac{1}{e}$`, "(1)/(e)"],
    [String.raw`$\log_{\frac{1}{e}}a=0$`, "log_((1)/(e))a=0"],
    [String.raw`$x\in]c,+\infty[$`, "x∈]c,+∞["],
    [String.raw`$\lim_{m\to-\infty}f'(m)=0$`, "lim_(m→−∞)f′(m)=0"],
    [String.raw`$\sqrt{x^2+y^2}$`, "√(x²+y²)"],
    [String.raw`$$\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$`, "(−b±√(b²−4ac))/(2a)"],
  ])("renderiza LaTeX sem comandos crus: %s", (source, expected) => {
    const rendered = latexToPdfText(source);
    expect(rendered).toContain(expected);
    expect(rendered).not.toMatch(/\\(?:frac|sqrt|log|in|infty|left|right|lim|quad)/);
    expect(rendered).not.toContain("$");
  });

  it("mantém fórmulas inline na frase e fórmulas em bloco em linha própria", () => {
    const rendered = latexToPdfText(String.raw`A função $f(x)=x^2$ é simples. $$\frac{1}{e}$$ Fim.`);
    expect(rendered).toContain("A função f(x)=x² é simples.");
    expect(rendered).toContain("\n(1)/(e)\n");
  });

  it("não duplica a anotação LaTeX incluída no MathML do KaTeX", () => {
    const rendered = latexToPdfText(String.raw`$f(x)=x^3+3x^2-4x-12$`);
    expect(rendered.match(/f\(x\)/g)).toHaveLength(1);
  });

  it("não desenha novamente uma fórmula que já pertence ao enunciado", () => {
    expect(shouldRenderStandaloneFormula(
      String.raw`Considere $f(x)=x^3+3x^2-4x-12$.`,
      String.raw`f(x)=x^3+3x^2-4x-12`,
    )).toBe(false);
    expect(shouldRenderStandaloneFormula("Determine as raízes.", String.raw`f(x)=x^3+3x^2-4x-12`)).toBe(true);
  });
});
