import { describe, expect, it } from "vitest";
import { parseLessonImportJson, lessonJsonSchema } from "../../shared/lessonSchema.js";
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

describe("canonical question taxonomy", () => {
  const taxonomy = buildCanonicalLessonTaxonomy([{ disciplina: "fisica", conteudos: ["Cinemática"], assuntos_por_conteudo: [{ conteudo: "Cinemática", assuntos: ["Movimento Uniforme"] }] }]);
  it("reuses the canonical representation and spelling", () => expect(resolveLessonTaxonomy(taxonomy, { discipline: "FÍSICA", content: "cinematica", subject: "movimento uniforme" })).toEqual({ discipline: "fisica", content: "Cinemática", subject: "Movimento Uniforme" }));
  it("rejects taxonomy values that do not exist", () => expect(resolveLessonTaxonomy(taxonomy, { discipline: "fisica", content: "Astrologia", subject: "Mapas" })).toBeNull());
});
