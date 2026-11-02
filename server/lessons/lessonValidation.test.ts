import { describe, expect, it } from "vitest";
import { convertLessonV1ToV2, parseLessonImportJson, lessonJsonSchema } from "../../shared/lessonSchema.js";
import { validateLessonContent, validateLessonImport } from "./lessonValidation.js";
import { buildCanonicalLessonTaxonomy, resolveLessonTaxonomy } from "./lessonRouter.js";

const metadata = { title: "Bases da Cinemática", slug: "bases-da-cinematica", description: "Uma descrição válida.", discipline: "fisica", content: "Cinemática", subject: "Movimento Uniforme", level: null, displayOrder: 0 };
const validLesson = { schemaVersion: 1 as const, blocks: [
  { id: "texto-1", type: "text" as const, visible: true, content: "Texto com **ênfase** e $v = 2\\,m/s$." },
  { id: "formula-1", type: "formula" as const, visible: true, latex: "v = \\frac{\\Delta s}{\\Delta t}", align: "center" as const },
  { id: "imagem-1", type: "image" as const, visible: true, storagePath: "cinematica/referencial.webp", alt: "Dois referenciais", align: "center" as const, size: "large" as const },
] };

describe("lesson schema and import", () => {
  it("validates the official schema", () => expect(lessonJsonSchema.safeParse(validLesson).success).toBe(true));

  it("rejects an unknown block with a precise path", () => {
    const result = validateLessonContent({ schemaVersion: 1, blocks: [{ id: "x", type: "diagram", visible: true }] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.some(issue => issue.path.includes("blocks[0].type"))).toBe(true);
  });

  it.each(["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "[clique](javascript:alert(1))"])("rejects executable markdown: %s", content => {
    expect(validateLessonContent({ schemaVersion: 1, blocks: [{ id: "x", type: "text", visible: true, content }] }).success).toBe(false);
  });

  it("validates formula and image required fields", () => {
    const formula = validateLessonContent({ schemaVersion: 1, blocks: [{ id: "f", type: "formula", visible: true, latex: "\\frac{" }] });
    const image = validateLessonContent({ schemaVersion: 1, blocks: [{ id: "i", type: "image", visible: true, storagePath: "data:image/png;base64,abc", alt: "" }] });
    expect(formula.success).toBe(false);
    expect(image.success).toBe(false);
  });

  it("validates inline LaTeX before publication", () => {
    const result = validateLessonContent({ schemaVersion: 1, blocks: [{ id: "x", type: "text", visible: true, content: "Uma fórmula $\\frac{$ inválida." }] });
    expect(result.success).toBe(false);
  });

  it("accepts a valid imported lesson", () => expect(validateLessonImport({ metadata, lesson: validLesson }).success).toBe(true));

  it("reports invalid import without changing the current draft", () => {
    const original = structuredClone(validLesson);
    let draft = structuredClone(validLesson);
    const result = parseLessonImportJson(JSON.stringify({ metadata, lesson: { schemaVersion: 1, blocks: [{ id: "x", type: "table", visible: true }] } }));
    if (result.success) draft = result.data.lesson;
    expect(result.success).toBe(false);
    expect(draft).toEqual(original);
  });

  it("rejects duplicate stable block IDs", () => {
    const block = validLesson.blocks[0];
    expect(lessonJsonSchema.safeParse({ schemaVersion: 1, blocks: [block, block] }).success).toBe(false);
  });
});

describe("lesson schema v2", () => {
  const derivation = { id: "derivacao", type: "derivation" as const, visible: true, title: "Da definição à fórmula", initiallyOpen: false, steps: [{ id: "passo-1", text: "Partimos da definição.", latex: "v_m = \\frac{\\Delta s}{\\Delta t}" }] };
  const formulaCard = { id: "formula-card", type: "formula_card" as const, visible: true, title: "Velocidade média", latex: "v_m = \\frac{\\Delta s}{\\Delta t}", terms: [{ symbol: "v_m", meaning: "velocidade média", unit: "m/s" }], observations: ["Use unidades compatíveis."], validityConditions: ["Intervalo de tempo não nulo."], variant: "primary" as const };

  it("accepts sections, responsive grids, FormulaCard and DerivationBlock", () => {
    const lesson = { schemaVersion: 2, blocks: [{ id: "secao", type: "section", visible: true, title: "Movimento", anchor: "movimento", blocks: [{ id: "grid", type: "grid", visible: true, preset: "two", columns: [{ id: "coluna-a", blocks: [formulaCard] }, { id: "coluna-b", blocks: [derivation] }] }] }] };
    expect(validateLessonContent(lesson).success).toBe(true);
  });

  it("blocks nested containers and invalid grid presets", () => {
    const nested = { schemaVersion: 2, blocks: [{ id: "grid", type: "grid", visible: true, preset: "one", columns: [{ id: "coluna", blocks: [{ id: "outro-grid", type: "grid", visible: true, preset: "one", columns: [] }] }] }] };
    const wrongColumns = { schemaVersion: 2, blocks: [{ id: "grid", type: "grid", visible: true, preset: "four", columns: [{ id: "coluna", blocks: [] }] }] };
    expect(validateLessonContent(nested).success).toBe(false);
    expect(validateLessonContent(wrongColumns).success).toBe(false);
  });

  it("rejects duplicate IDs across nested blocks and derivation steps", () => {
    const lesson = { schemaVersion: 2, blocks: [{ id: "secao", type: "section", visible: true, title: "Seção", anchor: "secao", blocks: [{ ...derivation, steps: [{ id: "secao", text: "ID repetido." }] }] }] };
    const result = validateLessonContent(lesson);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.some(issue => issue.path.includes("steps[0].id"))).toBe(true);
  });

  it("validates FormulaCard and derivation LaTeX by the exact nested path", () => {
    const lesson = { schemaVersion: 2, blocks: [{ ...formulaCard, latex: "\\frac{" }, { ...derivation, id: "derivacao-2", steps: [{ id: "passo-2", latex: "\\sqrt{" }] }] };
    const result = validateLessonContent(lesson);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.map(issue => issue.path)).toEqual(expect.arrayContaining(["blocks[0].latex", "blocks[1].steps[0].latex"]));
  });

  it("keeps v1 unchanged until an explicit lossless conversion", () => {
    const parsed = lessonJsonSchema.parse(validLesson);
    expect(parsed.schemaVersion).toBe(1);
    if (parsed.schemaVersion === 1) expect(convertLessonV1ToV2(parsed)).toEqual({ ...parsed, schemaVersion: 2 });
  });
});

describe("canonical question taxonomy", () => {
  const taxonomy = buildCanonicalLessonTaxonomy([{ disciplina: "fisica", conteudos: ["Cinemática"], assuntos_por_conteudo: [{ conteudo: "Cinemática", assuntos: ["Movimento Uniforme"] }] }]);
  it("reuses the canonical representation and spelling", () => expect(resolveLessonTaxonomy(taxonomy, { discipline: "FÍSICA", content: "cinematica", subject: "movimento uniforme" })).toEqual({ discipline: "fisica", content: "Cinemática", subject: "Movimento Uniforme" }));
  it("rejects taxonomy values that do not exist", () => expect(resolveLessonTaxonomy(taxonomy, { discipline: "fisica", content: "Astrologia", subject: "Mapas" })).toBeNull());
});
