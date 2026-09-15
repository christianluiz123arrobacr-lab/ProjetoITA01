import katex from "katex";
import {
  lessonImportSchema,
  lessonJsonSchema,
  type LessonImport,
  type LessonJSON,
  type LessonValidationIssue,
  type SimpleLessonBlock,
  formatLessonIssues,
} from "../../shared/lessonSchema.js";

export function validateFormula(latex: string): string | null {
  try {
    katex.renderToString(latex, { throwOnError: true, strict: "error", trust: false });
    return null;
  } catch {
    return "Fórmula LaTeX inválida.";
  }
}

function inlineFormulas(markdown: string): string[] {
  const formulas: string[] = [];
  const displayPattern = /\$\$([\s\S]+?)\$\$/g;
  let match: RegExpExecArray | null;
  while ((match = displayPattern.exec(markdown)) !== null) formulas.push(match[1]);
  const withoutDisplay = markdown.replace(/\$\$[\s\S]+?\$\$/g, "");
  const inlinePattern = /(^|[^\\$])\$([^$\n]+?)\$(?!\$)/g;
  while ((match = inlinePattern.exec(withoutDisplay)) !== null) formulas.push(match[2]);
  return formulas;
}

function validateMarkdown(value: string | undefined, path: string, issues: LessonValidationIssue[]) {
  if (!value) return;
  for (const formula of inlineFormulas(value)) {
    if (validateFormula(formula)) {
      issues.push({ path, message: "Fórmula LaTeX inline inválida." });
      break;
    }
  }
}

function validateDerivation(
  derivation: { introduction?: string; conclusion?: string; steps: Array<{ text?: string; latex?: string; observation?: string }> },
  path: string,
  issues: LessonValidationIssue[],
) {
  validateMarkdown(derivation.introduction, `${path}.introduction`, issues);
  validateMarkdown(derivation.conclusion, `${path}.conclusion`, issues);
  derivation.steps.forEach((step, index) => {
    const stepPath = `${path}.steps[${index}]`;
    validateMarkdown(step.text, `${stepPath}.text`, issues);
    validateMarkdown(step.observation, `${stepPath}.observation`, issues);
    if (step.latex) {
      const message = validateFormula(step.latex);
      if (message) issues.push({ path: `${stepPath}.latex`, message });
    }
  });
}

function validateSimpleBlock(block: SimpleLessonBlock, path: string, issues: LessonValidationIssue[]) {
  if (block.type === "formula") {
    const message = validateFormula(block.latex);
    if (message) issues.push({ path: `${path}.latex`, message });
    return;
  }
  if (block.type === "formula_card") {
    const message = validateFormula(block.latex);
    if (message) issues.push({ path: `${path}.latex`, message });
    block.terms.forEach((term, index) => {
      const symbolMessage = validateFormula(term.symbol);
      if (symbolMessage) issues.push({ path: `${path}.terms[${index}].symbol`, message: symbolMessage });
    });
    validateMarkdown(block.description, `${path}.description`, issues);
    block.observations.forEach((value, index) => validateMarkdown(value, `${path}.observations[${index}]`, issues));
    block.validityConditions.forEach((value, index) => validateMarkdown(value, `${path}.validityConditions[${index}]`, issues));
    if (block.derivation) validateDerivation(block.derivation, `${path}.derivation`, issues);
    return;
  }
  if (block.type === "derivation") {
    validateDerivation(block, path, issues);
    return;
  }
  if (block.type === "text" || block.type === "highlight" || block.type === "intuition" || block.type === "common_mistake") {
    validateMarkdown(block.content, `${path}.content`, issues);
  } else if (block.type === "example") {
    validateMarkdown(block.problem, `${path}.problem`, issues);
    validateMarkdown(block.solution, `${path}.solution`, issues);
    validateMarkdown(block.conclusion, `${path}.conclusion`, issues);
  } else if (block.type === "summary") {
    block.points.forEach((point, index) => validateMarkdown(point, `${path}.points[${index}]`, issues));
  }
}

function validateBlocks(lesson: LessonJSON, issues: LessonValidationIssue[]) {
  lesson.blocks.forEach((block, index) => {
    const path = `blocks[${index}]`;
    if (block.type === "section") {
      validateMarkdown(block.description, `${path}.description`, issues);
      block.blocks.forEach((child, childIndex) => {
        const childPath = `${path}.blocks[${childIndex}]`;
        if (child.type === "grid") child.columns.forEach((column, columnIndex) => column.blocks.forEach((nested, nestedIndex) => validateSimpleBlock(nested, `${childPath}.columns[${columnIndex}].blocks[${nestedIndex}]`, issues)));
        else validateSimpleBlock(child, childPath, issues);
      });
    } else if (block.type === "grid") {
      block.columns.forEach((column, columnIndex) => column.blocks.forEach((child, childIndex) => validateSimpleBlock(child, `${path}.columns[${columnIndex}].blocks[${childIndex}]`, issues)));
    } else validateSimpleBlock(block, path, issues);
  });
}

export function validateLessonContent(input: unknown): { success: true; data: LessonJSON } | { success: false; issues: LessonValidationIssue[] } {
  const parsed = lessonJsonSchema.safeParse(input);
  if (!parsed.success) return { success: false, issues: formatLessonIssues(parsed.error) };
  const issues: LessonValidationIssue[] = [];
  validateBlocks(parsed.data, issues);
  return issues.length ? { success: false, issues } : { success: true, data: parsed.data };
}

function hasVisibleContent(lesson: LessonJSON) {
  return lesson.blocks.some(block => {
    if (!block.visible) return false;
    if (block.type === "section") return block.blocks.some(child => child.visible);
    if (block.type === "grid") return block.columns.some(column => column.blocks.some(child => child.visible));
    return true;
  });
}

export function validateLessonForPublication(input: unknown): { success: true; data: LessonJSON } | { success: false; issues: LessonValidationIssue[] } {
  const result = validateLessonContent(input);
  if (!result.success) return result;
  if (!hasVisibleContent(result.data)) return { success: false, issues: [{ path: "blocks", message: "A aula publicada precisa ter ao menos um bloco visível." }] };
  return result;
}

export function validateLessonImport(input: unknown): { success: true; data: LessonImport } | { success: false; issues: LessonValidationIssue[] } {
  const parsed = lessonImportSchema.safeParse(input);
  if (!parsed.success) return { success: false, issues: formatLessonIssues(parsed.error) };
  const content = validateLessonForPublication(parsed.data.lesson);
  return content.success ? { success: true, data: parsed.data } : content;
}
