import React, { type CSSProperties } from "react";
import katex from "katex";

import {
  KATEX_RENDER_OPTIONS,
  normalizeMathSource,
} from "@/lib/mathRendering";

interface MathFormulaProps {
  children?: string;
  formula?: string;
  inline?: boolean;
  display?: boolean;
  className?: string;
}

function unwrapMathDelimiters(value: string) {
  const formula = normalizeMathSource(value).trim();

  if (formula.startsWith("$$") && formula.endsWith("$$")) {
    return formula.slice(2, -2).trim();
  }

  if (formula.startsWith("\\[") && formula.endsWith("\\]")) {
    return formula.slice(2, -2).trim();
  }

  if (formula.startsWith("\\(") && formula.endsWith("\\)")) {
    return formula.slice(2, -2).trim();
  }

  if (formula.startsWith("$") && formula.endsWith("$")) {
    return formula.slice(1, -1).trim();
  }

  return formula;
}

export function MathFormula({
  children,
  formula,
  inline,
  display,
  className = '',
}: MathFormulaProps) {
  const isDisplay =
    inline !== undefined ? !inline : display !== undefined ? display : true;

  const normalizedFormula = unwrapMathDelimiters(children || formula || "");
  const renderedFormula = katex.renderToString(normalizedFormula, {
    ...KATEX_RENDER_OPTIONS,
    displayMode: isDisplay,
    throwOnError: false,
    trust: false,
  });

  const style: CSSProperties = {
    display: isDisplay ? 'block' : 'inline-block',
    textAlign: isDisplay ? 'center' : ('inherit' as const),
    padding: isDisplay ? '0.75rem 0' : '0',
    margin: isDisplay ? '0.25rem 0' : '0',
    overflow: 'visible',
    minHeight: isDisplay ? '2rem' : 'auto',
    border: 'none',
    background: 'transparent',
    lineHeight: isDisplay ? '1.4' : 'inherit',
    fontFamily: 'inherit',
    verticalAlign: inline ? 'middle' : undefined,
  };

  const props = {
    className: `math-formula ${className}`.trim(),
    style,
    dangerouslySetInnerHTML: { __html: renderedFormula },
  };

  return isDisplay ? <div {...props} /> : <span {...props} />;
}
