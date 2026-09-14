import katex from "katex";
import { lessonImportSchema, lessonJsonSchema, type LessonImport, type LessonJSON, type LessonValidationIssue, formatLessonIssues } from "../../shared/lessonSchema.js";

export function validateFormula(latex: string): string | null {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: "error", trust: false });
    return null;
  } catch {
    return "Fórmula LaTeX inválida.";
  }
}

function markdownValues(block: LessonJSON["blocks"][number]): string[] {
  if (block.type === "text" || block.type === "highlight" || block.type === "intuition" || block.type === "common_mistake") return [block.content];
  if (block.type === "example") return [block.problem, block.solution, block.conclusion ?? ""];
  if (block.type === "summary") return block.points;
  return [];
}

function inlineFormulas(markdown: string): string[] {
  const formulas: string[] = [];
  for (const match of markdown.matchAll(/\$\$([\s\S]+?)\$\$/g)) formulas.push(match[1]);
  const withoutDisplay = markdown.replace(/\$\$[\s\S]+?\$\$/g, "");
  for (const match of withoutDisplay.matchAll(/(^|[^\\$])\$([^$\n]+?)\$(?!\$)/g)) formulas.push(match[2]);
  return formulas;
}

export function validateLessonContent(input: unknown): { success: true; data: LessonJSON } | { success: false; issues: LessonValidationIssue[] } {
  const parsed = lessonJsonSchema.safeParse(input);
  if (!parsed.success) return { success: false, issues: formatLessonIssues(parsed.error) };
  const issues: LessonValidationIssue[] = [];
  parsed.data.blocks.forEach((block, index) => {
    if (block.type === "formula") {
      const message = validateFormula(block.latex);
      if (message) issues.push({ path: `blocks[${index}].latex`, message });
    }
    for (const formula of markdownValues(block).flatMap(inlineFormulas)) {
      const message = validateFormula(formula);
      if (message) { issues.push({ path: `blocks[${index}]`, message: "Fórmula LaTeX inline inválida." }); break; }
    }
  });
  return issues.length ? { success: false, issues } : { success: true, data: parsed.data };
}

export function validateLessonForPublication(input: unknown): { success: true; data: LessonJSON } | { success: false; issues: LessonValidationIssue[] } {
  const result = validateLessonContent(input);
  if (!result.success) return result;
  if (!result.data.blocks.some(block => block.visible)) {
    return { success: false, issues: [{ path: "blocks", message: "A aula publicada precisa ter ao menos um bloco visível." }] };
  }
  return result;
}

export function validateLessonImport(input: unknown): { success: true; data: LessonImport } | { success: false; issues: LessonValidationIssue[] } {
  const parsed = lessonImportSchema.safeParse(input);
  if (!parsed.success) return { success: false, issues: formatLessonIssues(parsed.error) };
  const content = validateLessonForPublication(parsed.data.lesson);
  return content.success ? { success: true, data: parsed.data } : content;
}
