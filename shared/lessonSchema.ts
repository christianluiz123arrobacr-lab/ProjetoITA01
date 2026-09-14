import { z } from "zod";

export const LESSON_SCHEMA_VERSION = 1 as const;

const executableContent = /<\s*\/?\s*[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|on(?:error|load|click)\s*=/i;
const safeMarkdown = z.string().trim().min(1, "Conteúdo obrigatório.").max(30_000).refine(
  value => !executableContent.test(value),
  "HTML e conteúdo executável não são permitidos."
);
const blockId = z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, _ ou - no ID.");
const baseBlock = { id: blockId, visible: z.boolean() };
const optionalTitle = z.string().trim().min(1).max(180).optional();

export const highlightVariants = [
  "info", "attention", "important", "tip", "key_concept", "observation",
] as const;

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ ...baseBlock, type: z.literal("text"), title: optionalTitle, content: safeMarkdown }),
  z.object({
    ...baseBlock,
    type: z.literal("formula"),
    latex: z.string().trim().min(1, "A fórmula é obrigatória.").max(8_000),
    caption: z.string().trim().min(1).max(500).optional(),
    align: z.enum(["left", "center", "right"]).default("center"),
  }),
  z.object({ ...baseBlock, type: z.literal("highlight"), variant: z.enum(highlightVariants), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("intuition"), title: optionalTitle, content: safeMarkdown }),
  z.object({ ...baseBlock, type: z.literal("common_mistake"), title: optionalTitle, content: safeMarkdown }),
  z.object({
    ...baseBlock,
    type: z.literal("example"),
    problem: safeMarkdown,
    solution: safeMarkdown,
    conclusion: safeMarkdown.optional(),
  }),
  z.object({
    ...baseBlock,
    type: z.literal("image"),
    storagePath: z.string().trim().min(1).max(500)
      .refine(value => !/^(?:data:|https?:|javascript:|\/\/)/i.test(value) && !value.split("/").includes(".."), "Informe um caminho seguro do Storage."),
    alt: z.string().trim().min(1, "O texto alternativo é obrigatório.").max(500),
    caption: z.string().trim().min(1).max(500).optional(),
    align: z.enum(["left", "center", "right"]).default("center"),
    size: z.enum(["small", "medium", "large", "full"]).default("large"),
  }),
  z.object({
    ...baseBlock,
    type: z.literal("summary"),
    title: optionalTitle,
    points: z.array(safeMarkdown.max(2_000)).min(1, "Inclua ao menos um ponto.").max(30),
  }),
]);

export const lessonJsonSchema = z.object({
  schemaVersion: z.literal(LESSON_SCHEMA_VERSION),
  blocks: z.array(lessonBlockSchema).max(200),
}).superRefine((lesson, ctx) => {
  const ids = new Set<string>();
  lesson.blocks.forEach((block, index) => {
    if (ids.has(block.id)) ctx.addIssue({ code: "custom", path: ["blocks", index, "id"], message: "ID de bloco duplicado." });
    ids.add(block.id);
  });
});

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

export const lessonImportSchema = z.object({
  metadata: lessonMetadataSchema,
  lesson: lessonJsonSchema,
});

export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonJSON = z.infer<typeof lessonJsonSchema>;
export type LessonMetadata = z.infer<typeof lessonMetadataSchema>;
export type LessonImport = z.infer<typeof lessonImportSchema>;

export type LessonValidationIssue = { path: string; message: string };

export function formatLessonIssues(error: z.ZodError): LessonValidationIssue[] {
  return error.issues.map(issue => ({
    path: issue.path.reduce<string>((path, part) => typeof part === "number" ? `${path}[${part}]` : path ? `${path}.${String(part)}` : String(part), ""),
    message: issue.message,
  }));
}

export function parseLessonImportJson(raw: string): { success: true; data: LessonImport } | { success: false; issues: LessonValidationIssue[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { success: false, issues: [{ path: "$", message: "JSON inválido." }] };
  }
  const result = lessonImportSchema.safeParse(parsed);
  return result.success ? { success: true, data: result.data } : { success: false, issues: formatLessonIssues(result.error) };
}
