import katex, { type KatexOptions } from "katex";

export const MATH_MACROS = {
  "\\sen": "\\operatorname{sen}",
} as const;

export const KATEX_RENDER_OPTIONS: KatexOptions = {
  macros: MATH_MACROS,
  throwOnError: false,
};

const escapedMacroPattern = /\\\\(?=sen(?:\b|\^|\{|\(|\\))/g;

export function normalizeMathSource(value: string) {
  return String(value ?? "").replace(escapedMacroPattern, "\\");
}

export function renderMathToMathMl(formula: string) {
  return katex.renderToString(normalizeMathSource(formula), {
    ...KATEX_RENDER_OPTIONS,
    output: "mathml",
  });
}
