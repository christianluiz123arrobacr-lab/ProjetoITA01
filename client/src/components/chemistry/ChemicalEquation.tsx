import { useMemo } from "react";
import { renderChemicalEquation } from "@/lib/mathRendering";

export function ChemicalEquation({ latex, inline = false }: { latex: string; inline?: boolean }) {
  const html = useMemo(() => { try { return renderChemicalEquation(latex); } catch { return null; } }, [latex]);
  if (!html) return <span role="status" className="text-sm text-slate-500">Fórmula química indisponível.</span>;
  const Tag = inline ? "span" : "div";
  return <Tag className={inline ? "inline-block" : "overflow-x-auto rounded-xl bg-slate-50 p-3 text-center"} dangerouslySetInnerHTML={{ __html: html }} />;
}
