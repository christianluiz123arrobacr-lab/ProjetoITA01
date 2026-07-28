import { describe, expect, it } from "vitest";
import { QUESTION_PDF_EXPORT_LIMIT, questionPdfFiltersSchema, questionRowMatchesPdfFilters } from "../shared/questionPdf";
import { buildPdfFileName, buildPdfFilterSummary, chunkAnswers, fitPdfImage, getQuestionPdfTags, planQuestionPages, QUESTION_PDF_LAYOUT } from "../client/src/lib/questionPdfLayout";
import { getPdfMathRasterSize, isSafePdfMathSvg, latexToPdfText, shouldRenderStandaloneFormula, splitPdfMathSegments } from "../client/src/lib/questionPdfGenerator";
import { KATEX_RENDER_OPTIONS, MATH_MACROS, normalizeMathSource, renderMathToMathMl } from "../client/src/lib/mathRendering";
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
    const fitted = fitPdfImage(1200, 800, QUESTION_PDF_LAYOUT.statementImageMaxWidth, QUESTION_PDF_LAYOUT.statementImageMaxHeight);
    expect(fitted.width).toBeCloseTo(641.25);
    expect(fitted.height).toBeCloseTo(427.5);
    expect(fitPdfImage(200, 100, QUESTION_PDF_LAYOUT.optionImageMaxWidth, QUESTION_PDF_LAYOUT.optionImageMaxHeight)).toEqual({ width: 200, height: 100 });
  });
  it("mantém imagens e espaço de resolução nos limites compactos definidos", () => {
    expect(QUESTION_PDF_LAYOUT).toMatchObject({ statementImageMaxWidth: 708, optionImageMaxWidth: 531, resolutionSpaceHeight: 168 });
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

  it("separa fórmulas para composição matemática visual no canvas", () => {
    expect(splitPdfMathSegments(String.raw`Como $\tan x=\frac{\sen x}{\cos x}$, determine x.`)).toEqual([
      { kind: "text", value: "Como ", display: false },
      { kind: "math", value: String.raw`\tan x=\frac{\sen x}{\cos x}`, display: false },
      { kind: "text", value: ", determine x.", display: false },
    ]);
  });

  it("marca fórmulas de bloco para ocupar uma linha própria", () => {
    expect(splitPdfMathSegments(String.raw`Antes $$\frac{a}{b}$$ depois`)[1]).toEqual({
      kind: "math",
      value: String.raw`\frac{a}{b}`,
      display: true,
    });
  });

  it("não permite foreignObject ou recursos remotos no SVG rasterizado", () => {
    expect(isSafePdfMathSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).toBe(true);
    expect(isSafePdfMathSvg('<svg><foreignObject><div>fórmula</div></foreignObject></svg>')).toBe(false);
    expect(isSafePdfMathSvg('<svg><use href="https://cdn.example/glyph.svg"/></svg>')).toBe(false);
  });

  it("mantém letras matemáticas no tamanho da fonte e permite altura natural para frações", () => {
    const regular = getPdfMathRasterSize(600, 720, 20);
    const fraction = getPdfMathRasterSize(900, 1450, 20);
    expect(regular.height).toBeCloseTo(14.4);
    expect(fraction.height).toBeCloseTo(29);
    expect(regular.height).toBeLessThan(20);
    expect(fraction.height).toBeGreaterThan(regular.height);
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

  it.each([
    [String.raw`\sen\alpha`, "senα"],
    [String.raw`\sen(\alpha+\beta)=1`, "sen(α+β)=1"],
    [String.raw`\sen^2 x+\cos^2 x=1`, "sen²x+cos²x=1"],
    [String.raw`\frac{\sen x}{\cos x}`, "(senx)/(cosx)"],
    [String.raw`(\cos\alpha-\cos\beta)^2+(\sen\alpha+\sen\beta)^2=2`, "(cosα−cosβ)²+(senα+senβ)²=2"],
    [String.raw`$ \sen\alpha $`, "senα"],
    [String.raw`$$\sen^2 x+\cos^2 x=1$$`, "sen²x+cos²x=1"],
  ])("renderiza o operador brasileiro sen no PDF: %s", (source, expected) => {
    const rendered = latexToPdfText(source, !source.includes("$"));
    expect(rendered.replace(/\s/g, "")).toContain(expected);
    expect(rendered).not.toContain("\\sen");
    expect(rendered).not.toContain("sin");
  });

  it("compartilha o macro sen entre KaTeX do site e exportação", () => {
    expect(MATH_MACROS).toEqual({ "\\sen": "\\operatorname{sen}" });
    expect(KATEX_RENDER_OPTIONS.macros).toBe(MATH_MACROS);
    const mathMl = renderMathToMathMl(String.raw`\sen(\alpha+\beta)=1`);
    expect(mathMl).toContain("sen");
    expect(mathMl).not.toContain("katex-error");
  });

  it("normaliza somente o macro sen duplicadamente escapado vindo de JSON", () => {
    expect(normalizeMathSource(String.raw`\\sen\alpha`)).toBe(String.raw`\sen\alpha`);
    expect(normalizeMathSource("A palavra sensacional permanece igual.")).toBe("A palavra sensacional permanece igual.");
  });
});
