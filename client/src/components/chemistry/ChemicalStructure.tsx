import { useEffect, useState } from "react";
import { chemicalStructureSvgDataUrl } from "@/lib/chemicalStructureSvg";

export function ChemicalStructure({ smiles, caption }: { smiles: string; caption?: string }) {
  const [result, setResult] = useState<{ url: string | null; loading: boolean }>({ url: null, loading: true });
  useEffect(() => {
    let active = true;
    setResult({ url: null, loading: true });
    chemicalStructureSvgDataUrl(smiles)
      .then((url) => { if (active) setResult({ url, loading: false }); })
      .catch(() => { if (active) setResult({ url: null, loading: false }); });
    return () => { active = false; };
  }, [smiles]);
  if (result.loading) return <div role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-500">Renderizando estrutura molecular…</div>;
  if (!result.url) return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Não foi possível renderizar esta estrutura molecular.{caption ? <span className="mt-1 block">{caption}</span> : null}</div>;
  return <figure className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-4">
    <img src={result.url} alt={caption ? `Estrutura molecular: ${caption}` : `Estrutura molecular para ${smiles}`} className="mx-auto h-auto max-h-64 w-full object-contain" />
    {caption ? <figcaption className="mt-2 text-center text-sm text-slate-600">{caption}</figcaption> : null}
  </figure>;
}
