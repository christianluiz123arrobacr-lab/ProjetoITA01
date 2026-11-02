import { z } from "zod";

export const LESSON_SCHEMA_VERSION = 2 as const;
export const LESSON_SCHEMA_V1 = 1 as const;
export const LESSON_MAX_BLOCKS = 300;

const executableContent = /<\s*\/?\s*[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|on(?:error|load|click)\s*=/i;
const safeMarkdown = z.string().trim().min(1, "Conteúdo obrigatório.").max(30_000).refine(
  value => !executableContent.test(value),
  "HTML e conteúdo executável não são permitidos.",
);
const shortMarkdown = safeMarkdown.max(4_000);
const blockId = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, _ ou - no ID.");
const baseBlock = { id: blockId, visible: z.boolean() };
const optionalTitle = z.string().trim().min(1).max(180).optional();
const optionalText = z.string().trim().min(1).max(4_000).optional();
const latex = z.string().trim().min(1, "A fórmula é obrigatória.").max(8_000);

export const highlightVariants = [
  "info", "attention", "important", "tip", "key_concept", "observation",
] as const;
export const formulaCardVariants = ["default", "primary", "success", "warning"] as const;
export const gridPresets = ["one", "two", "three", "four", "one_third_two_thirds", "two_thirds_one_third"] as const;

export const derivationStepSchema = z.object({
  id: blockId,
  title: optionalTitle,
  text: safeMarkdown.optional(),
  latex: latex.optional(),
  observation: shortMarkdown.optional(),
}).superRefine((step, ctx) => {
  if (!step.text && !step.latex && !step.observation) {
    ctx.addIssue({ code: "custom", path: ["text"], message: "Inclua texto, fórmula ou observação neste passo." });
  }
});

export const derivationContentSchema = z.object({
  title: z.string().trim().min(1).max(180),
  introduction: safeMarkdown.optional(),
  initiallyOpen: z.boolean().default(false),
  steps: z.array(derivationStepSchema).min(1, "Inclua ao menos um passo.").max(40),
  conclusion: safeMarkdown.optional(),
});

const legacySimpleBlocks = [
  z.object({ ...baseBlock, type: z.literal("text"), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("formula"), latex, caption: z.string().trim().min(1).max(500).optional(), align: z.enum(["left", "center", "right"]).default("center") }),
  z.object({ ...baseBlock, type: z.literal("highlight"), variant: z.enum(highlightVariants), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("intuition"), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("common_mistake"), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("example"), problem: safeMarkdown, solution: safeMarkdown, conclusion: safeMarkdown.optional() }),
  z.object({
    ...baseBlock,
    type: z.literal("image"),
    storagePath: z.string().trim().min(1).max(500).refine(value => !/^(?:data:|https?:|javascript:|\/\/)/i.test(value) && !value.split("/").includes(".."), "Informe um caminho seguro do Storage."),
    alt: z.string().trim().min(1, "O texto alternativo é obrigatório.").max(500),
    caption: z.string().trim().min(1).max(500).optional(),
    align: z.enum(["left", "center", "right"]).default("center"),
    size: z.enum(["small", "medium", "large", "full"]).default("large"),
  }),
  z.object({ ...baseBlock, type: z.literal("summary"), title: optionalTitle, points: z.array(safeMarkdown.max(2_000)).min(1, "Inclua ao menos um ponto.").max(30) }),
] as const;

export const legacyLessonBlockSchema = z.discriminatedUnion("type", legacySimpleBlocks);

const formulaTermSchema = z.object({
  symbol: z.string().trim().min(1).max(200),
  meaning: z.string().trim().min(1).max(500),
  unit: z.string().trim().min(1).max(120).optional(),
  note: optionalText,
});

const formulaCardSchema = z.object({
  ...baseBlock,
  type: z.literal("formula_card"),
  title: optionalTitle,
  latex,
  description: safeMarkdown.optional(),
  terms: z.array(formulaTermSchema).max(30).default([]),
  siUnit: z.string().trim().min(1).max(120).optional(),
  observations: z.array(shortMarkdown).max(20).default([]),
  validityConditions: z.array(shortMarkdown).max(20).default([]),
  derivation: derivationContentSchema.optional(),
  variant: z.enum(formulaCardVariants).default("default"),
});

const derivationBlockSchema = z.object({ ...baseBlock, type: z.literal("derivation"), ...derivationContentSchema.shape });

export const simpleLessonBlockSchema = z.discriminatedUnion("type", [
  ...legacySimpleBlocks,
  formulaCardSchema,
  derivationBlockSchema,
]);

const gridColumnSchema = z.object({ id: blockId, blocks: z.array(simpleLessonBlockSchema).max(40) });

export const gridBlockSchema = z.object({
  ...baseBlock,
  type: z.literal("grid"),
  preset: z.enum(gridPresets),
  columns: z.array(gridColumnSchema).min(1).max(4),
}).superRefine((grid, ctx) => {
  const expected = { one: 1, two: 2, three: 3, four: 4, one_third_two_thirds: 2, two_thirds_one_third: 2 }[grid.preset];
  if (grid.columns.length !== expected) ctx.addIssue({ code: "custom", path: ["columns"], message: `O preset ${grid.preset} exige ${expected} coluna(s).` });
});

export const sectionBlockSchema = z.object({
  ...baseBlock,
  type: z.literal("section"),
  title: z.string().trim().min(1).max(180),
  description: safeMarkdown.optional(),
  anchor: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use uma âncora com letras minúsculas, números e hífens."),
  blocks: z.array(z.union([simpleLessonBlockSchema, gridBlockSchema])).max(100),
});

export const lessonBlockSchema = z.union([simpleLessonBlockSchema, sectionBlockSchema, gridBlockSchema]);

type AnyLessonBlock = z.infer<typeof lessonBlockSchema>;

function validateDocumentIds(lesson: { blocks: AnyLessonBlock[] }, ctx: z.RefinementCtx) {
  const ids = new Set<string>();
  let count = 0;
  const register = (id: string, path: (string | number)[]) => {
    count += 1;
    if (ids.has(id)) ctx.addIssue({ code: "custom", path, message: "ID duplicado no documento." });
    ids.add(id);
  };
  const visitSimple = (block: z.infer<typeof simpleLessonBlockSchema>, path: (string | number)[]) => {
    register(block.id, [...path, "id"]);
    if (block.type === "derivation" || (block.type === "formula_card" && block.derivation)) {
      const derivation = block.type === "derivation" ? block : block.derivation!;
      const stepsPath = block.type === "derivation" ? [...path, "steps"] : [...path, "derivation", "steps"];
      derivation.steps.forEach((step, index) => register(step.id, [...stepsPath, index, "id"]));
    }
  };
  const visitGrid = (grid: z.infer<typeof gridBlockSchema>, path: (string | number)[]) => {
    register(grid.id, [...path, "id"]);
    grid.columns.forEach((column, columnIndex) => {
      register(column.id, [...path, "columns", columnIndex, "id"]);
      column.blocks.forEach((block, blockIndex) => visitSimple(block, [...path, "columns", columnIndex, "blocks", blockIndex]));
    });
  };
  lesson.blocks.forEach((block, index) => {
    const path: (string | number)[] = ["blocks", index];
    if (block.type === "section") {
      register(block.id, [...path, "id"]);
      block.blocks.forEach((child, childIndex) => child.type === "grid" ? visitGrid(child, [...path, "blocks", childIndex]) : visitSimple(child, [...path, "blocks", childIndex]));
    } else if (block.type === "grid") visitGrid(block, path);
    else visitSimple(block, path);
  });
  if (count > LESSON_MAX_BLOCKS) ctx.addIssue({ code: "custom", path: ["blocks"], message: `A aula excede o limite de ${LESSON_MAX_BLOCKS} elementos identificados.` });
}

export const lessonJsonV1Schema = z.object({ schemaVersion: z.literal(LESSON_SCHEMA_V1), blocks: z.array(legacyLessonBlockSchema).max(200) }).superRefine(validateDocumentIds);
export const lessonJsonV2Schema = z.object({ schemaVersion: z.literal(LESSON_SCHEMA_VERSION), blocks: z.array(lessonBlockSchema).max(150) }).superRefine(validateDocumentIds);
export const lessonJsonSchema = z.discriminatedUnion("schemaVersion", [lessonJsonV1Schema, lessonJsonV2Schema]);

export const lessonMetadataSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug com letras minúsculas, números e hífens."),
  description: z.string().trim().min(1).max(800),
  discipline: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(160),
  subject: z.string().trim().min(1).max(180),
  level: z.string().trim().min(1).max(80).nullable().optional(),
  displayOrder: z.number().int().min(0).max(100_000).default(0),
});

export const lessonImportSchema = z.object({ metadata: lessonMetadataSchema, lesson: lessonJsonSchema });

export type LegacyLessonBlock = z.infer<typeof legacyLessonBlockSchema>;
export type SimpleLessonBlock = z.infer<typeof simpleLessonBlockSchema>;
export type GridBlock = z.infer<typeof gridBlockSchema>;
export type SectionBlock = z.infer<typeof sectionBlockSchema>;
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonJSON = z.infer<typeof lessonJsonSchema>;
export type LessonJSONV1 = z.infer<typeof lessonJsonV1Schema>;
export type LessonJSONV2 = z.infer<typeof lessonJsonV2Schema>;
export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
export type LessonImport = z.infer<typeof lessonImportSchema>;
export type LessonValidationIssue = { path: string; message: string };

export function formatLessonIssues(error: z.ZodError): LessonValidationIssue[] {
  return error.issues.map(issue => ({
    path: issue.path.reduce<string>((path, part) => typeof part === "number" ? `${path}[${part}]` : path ? `${path}.${String(part)}` : String(part), ""),
    message: issue.message,
  }));
}

export function convertLessonV1ToV2(lesson: LessonJSONV1): LessonJSONV2 {
  return lessonJsonV2Schema.parse({ schemaVersion: LESSON_SCHEMA_VERSION, blocks: lesson.blocks });
}

export function parseLessonImportJson(raw: string): { success: true; data: LessonImport } | { success: false; issues: LessonValidationIssue[] } {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { return { success: false, issues: [{ path: "$", message: "JSON inválido." }] }; }
  const result = lessonImportSchema.safeParse(parsed);
  return result.success ? { success: true, data: result.data } : { success: false, issues: formatLessonIssues(result.error) };
}
