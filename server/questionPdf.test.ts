import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { QUESTION_PDF_EXPORT_LIMIT, questionPdfFiltersSchema, questionRowMatchesPdfFilters } from "../shared/questionPdf";
import { buildPdfFileName, buildPdfFilterSummary, chunkAnswers, fitPdfImage, getQuestionPdfTags, planQuestionPages, QUESTION_PDF_LAYOUT } from "../client/src/lib/questionPdfLayout";
import { buildPdfLogoForm, buildVectorPdfTestDocument, estimatePdfRichTextHeight, getPdfMathVectorSize, isSafePdfMathSvg, latexToPdfText, measurePdfMath, splitPdfMathSegments, textWidth } from "../client/src/lib/questionPdfGenerator";
import { KATEX_RENDER_OPTIONS, MATH_MACROS, normalizeMathSource, renderMathToMathMl } from "../client/src/lib/mathRendering";
import { buildQuestionRichContent, parseRichQuestionText } from "../client/src/lib/richQuestionContent";
import type { Question } from "../client/src/types/question";

const filters = questionPdfFiltersSchema.parse({ institutions: ["ITA", "AFA"], years: [2025, 2026], subjects: ["fisica"], topics: ["Dinâmica"], difficulties: ["medio"] });
const row = { id: "1", publicada: true, disciplina: "fisica", conteudo: "Dinâmica", assunto: "Forças", instituição: "ITA", ano: 2026, dificuldade: "medio", codigo: "F-1", enunciado: "Calcule $F=ma$" };
const question: Question = { id: "1", subject: "fisica", topic: "Dinâmica", topics: ["Dinâmica"], subtopic: "Forças", institution: "ITA", year: 2026, exam: "ITA", statement: "Calcule $F=ma$", formula: "$$F=ma$$", imageUrl: "https://project.supabase.co/storage/v1/object/public/q/image.png", options: [{ id: "a", label: "A", text: "2 N", imageUrl: "https://project.supabase.co/a.png" }], correctOptionId: "a", difficulty: "medio" };

const veryHardFilters = questionPdfFiltersSchema.parse({ difficulties: ["muito_dificil"] });

describe("exportação de questões em PDF", () => {
  it("usa os filtros ativos", () => expect(questionRowMatchesPdfFilters(row, filters)).toBe(true));
  it("filtra e rotula muito_dificil no PDF", () => {
    expect(questionRowMatchesPdfFilters({ ...row, dificuldade: "muito_dificil" }, veryHardFilters)).toBe(true);
    expect(getQuestionPdfTags({ ...question, difficulty: "muito_dificil" })).toContain("Muito difícil");
  });
  it("rejeita instituição fora do filtro", () => expect(questionRowMatchesPdfFilters({ ...row, instituição: "IME" }, filters)).toBe(false));
  it("considera resultados além da página visível", () => expect(Array.from({ length: 41 }, (_, i) => ({ ...row, id: String(i) })).filter(item => questionRowMatchesPdfFilters(item, filters))).toHaveLength(41));
  it("mantém limite técnico público e configurável", () => expect(QUESTION_PDF_EXPORT_LIMIT).toBe(120));
  it("aceita questão somente com texto", () => expect(getQuestionPdfTags({ ...question, imageUrl: undefined, options: [{ id: "a", label: "A", text: "texto" }] })).toContain("Física"));
  it("preserva referência de imagem do enunciado", () => expect(question.imageUrl).toContain("supabase.co"));
  it("preserva imagem em alternativa", () => expect(question.options[0].imageUrl).toContain("supabase.co"));
  it("reduz imagens grandes sem ampliar imagens pequenas ou deformar a proporção", () => {
    const fitted = fitPdfImage(1200, 800, QUESTION_PDF_LAYOUT.statementImageMaxWidth, QUESTION_PDF_LAYOUT.statementImageMaxHeight);
    expect(fitted.width).toBeCloseTo(250);
    expect(fitted.height).toBeCloseTo(166.67);
    expect(fitPdfImage(200, 100, QUESTION_PDF_LAYOUT.optionImageMaxWidth, QUESTION_PDF_LAYOUT.optionImageMaxHeight)).toEqual({ width: 190, height: 95 });
  });
  it("mantém imagens e espaço de resolução nos limites compactos definidos", () => {
    expect(QUESTION_PDF_LAYOUT).toMatchObject({ statementImageMaxWidth: 250, optionImageMaxWidth: 190, resolutionSpaceHeight: 76 });
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

  it("separa fórmulas para composição matemática vetorial", () => {
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

  it("mantém fórmula inline exatamente entre os trechos de texto", () => {
    expect(parseRichQuestionText("João comprou $x+4$ maçãs.")).toEqual([
      { type: "text", value: "João comprou " },
      { type: "inlineMath", value: "x+4" },
      { type: "text", value: " maçãs." },
    ]);
  });

  it("preserva fórmula em bloco e quebras reais na ordem semântica", () => {
    expect(parseRichQuestionText("Calcule:\n$$x+4=10$$\nDetermine o valor de x.")).toEqual([
      { type: "text", value: "Calcule:" }, { type: "lineBreak" },
      { type: "blockMath", value: "x+4=10" }, { type: "lineBreak" },
      { type: "text", value: "Determine o valor de x." },
    ]);
  });

  it("não acrescenta o campo formula legado ao conteúdo posicionado", () => {
    const legacy = { statement: "Determine o valor.", formula: "$$x+4=10$$" };
    expect(buildQuestionRichContent(legacy)).toEqual([{ type: "text", value: "Determine o valor." }]);
  });

  it("não permite foreignObject ou recursos remotos no SVG rasterizado", () => {
    expect(isSafePdfMathSvg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')).toBe(true);
    expect(isSafePdfMathSvg('<svg><foreignObject><div>fórmula</div></foreignObject></svg>')).toBe(false);
    expect(isSafePdfMathSvg('<svg><use href="https://cdn.example/glyph.svg"/></svg>')).toBe(false);
  });

  it("mantém letras matemáticas vetoriais e permite altura natural para frações", () => {
    const regular = getPdfMathVectorSize(600, 720, 20);
    const fraction = getPdfMathVectorSize(900, 1450, 20);
    expect(regular.height).toBeCloseTo(20);
    expect(fraction.height).toBeCloseTo(29);
    expect(regular.height).toBe(20);
    expect(fraction.height).toBeGreaterThan(regular.height);
  });

  it("gera texto real no stream PDF, sem imagem única de página", async () => {
    const bytes = await buildVectorPdfTestDocument("Texto pesquisavel da questao");
    const source = new TextDecoder("latin1").decode(bytes);
    expect(source).toContain("(Texto pesquisavel da questao) Tj");
    expect(source).not.toContain("/Width 1240 /Height 1754");
    expect(source).not.toContain("canvas.toDataURL");
  });

  it("não contém estratégia de screenshot ou JPEG de página inteira", () => {
    const source = readFileSync(new URL("../client/src/lib/questionPdfGenerator.ts", import.meta.url), "utf8");
    expect(source).not.toContain("canvas.toDataURL");
    expect(source).not.toContain("buildRasterPdf");
    expect(source).not.toContain("html2canvas");
    expect(source).not.toContain("PAGE_WIDTH} /Height ${PAGE_HEIGHT}");
  });

  it("mantém a marca d'água vetorial em todas as páginas", async () => {
    const logoSvg = readFileSync(new URL("../client/public/brand/projeto-vetor-logo.svg", import.meta.url), "utf8");
    const source = new TextDecoder("latin1").decode(await buildVectorPdfTestDocument("Questao", 2, logoSvg));
    expect(source.match(/\/GS1 gs/g)).toHaveLength(2);
    expect(source.match(/\/Logo Do/g)).toHaveLength(4);
    expect(source).toContain("/Subtype /Form /BBox [0 0 512 512]");
    expect(buildPdfLogoForm(logoSvg)).toContain("(PROJETO) Tj");
    expect(buildPdfLogoForm(logoSvg)).toContain("(VETOR) Tj");
  });

  it("mede texto com as métricas AFM da Helvetica usada no PDF", () => {
    expect(textWidth(" ", 10)).toBeCloseTo(2.78, 2);
    expect(textWidth("Sejam x e y dois números reais", 10)).toBeGreaterThan(textWidth("Sejamxeydoisnúmerosreais", 10));
    expect(textWidth("WWW", 10)).toBeGreaterThan(textWidth("iii", 10) * 3);
    expect(textWidth("ação", 10)).toBeCloseTo(textWidth("acao", 10), 5);
  });

  it("move um bloco matemático alto inteiro para a página seguinte", () => {
    const tall = measurePdfMath(String.raw`\frac{\sqrt{x^2+y^2}}{\sum_{i=1}^{n}i}`, 18);
    expect(planQuestionPages([500, tall.height + 120], 600)).toEqual([[0], [1]]);
  });

  it("mede fração e raiz como blocos mais altos sem sobreposição", () => {
    const plain = measurePdfMath(String.raw`a+b`, 10);
    const fraction = measurePdfMath(String.raw`\frac{a}{b}`, 10);
    const tallOption = measurePdfMath(String.raw`\sqrt{x^2+\frac{a}{b}}`, 10);
    expect(fraction.height).toBeGreaterThan(plain.height);
    expect(tallOption.height).toBeGreaterThan(plain.height);
    const nextAlternativeTop = 100 + tallOption.height + 6;
    expect(nextAlternativeTop).toBeGreaterThan(100 + tallOption.height);
  });

  it("reserva altura adicional para alternativas matemáticas altas", () => {
    const plain = estimatePdfRichTextHeight("A alternativa contém somente texto comum.", 300, 10);
    const tall = estimatePdfRichTextHeight(String.raw`A alternativa contém $\sqrt{x^2+\frac{a}{b}}$ e continua depois.`, 300, 10);
    expect(tall).toBeGreaterThan(plain);
  });

  it("mantém o espaço de resolução com a última alternativa na paginação", () => {
    const source = readFileSync(new URL("../client/src/lib/questionPdfGenerator.ts", import.meta.url), "utf8");
    expect(source).toContain("keepWithResolution");
    expect(source).toContain("minimumQuestionHeight");
    expect(source).not.toContain('ensure(QUESTION_PDF_LAYOUT.resolutionSpaceHeight); pdf.text("ESPAÇO PARA RESOLUÇÃO"');
  });

  it("não duplica a anotação LaTeX incluída no MathML do KaTeX", () => {
    const rendered = latexToPdfText(String.raw`$f(x)=x^3+3x^2-4x-12$`);
    expect(rendered.match(/f\(x\)/g)).toHaveLength(1);
  });

  it("remove a heurística que deslocava formula para um bloco separado", () => {
    const source = readFileSync(new URL("../client/src/lib/questionPdfGenerator.ts", import.meta.url), "utf8");
    expect(source).not.toContain("shouldRenderStandaloneFormula");
    expect(source).not.toMatch(/question\.formula/);
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
