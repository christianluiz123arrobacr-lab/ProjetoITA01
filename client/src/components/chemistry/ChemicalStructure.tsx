import { useMemo } from "react";
import { smilesToSvg } from "@/lib/chemicalStructureSvg";

export function ChemicalStructure({ smiles, caption }: { smiles: string; caption?: string }) {
  const result = useMemo(() => {
    try { return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(smilesToSvg(smiles))}` }; }
    catch { return { url: null }; }
  }, [smiles]);
  if (!result.url) return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Não foi possível desenhar esta estrutura molecular.</div>;
  return <figure className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4">
    <img src={result.url} alt={caption ? `Estrutura molecular: ${caption}` : `Estrutura molecular para ${smiles}`} className="mx-auto h-auto max-h-64 w-full object-contain" />
    {caption ? <figcaption className="mt-2 text-center text-sm text-slate-600">{caption}</figcaption> : null}
  </figure>;
}
