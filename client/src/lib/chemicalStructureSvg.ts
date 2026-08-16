import { safeSmilesSchema } from "@shared/chemistryContent";

export const CHEMICAL_STRUCTURE_RENDERER = "openchemlib" as const;

const FORBIDDEN_SVG = /<(?:script|foreignObject|iframe|object|embed|image|use)\b|\son[a-z]+\s*=|\s(?:href|xlink:href)\s*=|(?:javascript:|data:|url\s*\()/i;

/**
 * Generates a self-contained vector using OpenChemLib's chemical parser and
 * 2D coordinate inventor. The returned SVG is suitable for a future PDF
 * pipeline; it contains no user-provided markup or remote resources.
 */
let openChemLibPromise: Promise<typeof import("openchemlib")> | null = null;

function loadOpenChemLib() {
  openChemLibPromise ??= import("openchemlib");
  return openChemLibPromise;
}

export async function smilesToSvg(smiles: string, width = 520, height = 280): Promise<string> {
  const validatedSmiles = safeSmilesSchema.parse(smiles);
  const OCL = await loadOpenChemLib();
  const molecule = OCL.Molecule.fromSmiles(validatedSmiles);
  if (!molecule || molecule.getAllAtoms() === 0) throw new Error("SMILES inválido");

  molecule.inventCoordinates();
  const svg = molecule.toSVG(width, height, undefined, {
    autoCrop: true,
    autoCropMargin: 12,
    suppressChiralText: false,
  });

  if (typeof svg !== "string" || !/^\s*<svg\b/i.test(svg) || FORBIDDEN_SVG.test(svg)) {
    throw new Error("SVG molecular inseguro ou inválido");
  }
  return svg;
}

export async function chemicalStructureSvgDataUrl(smiles: string, width?: number, height?: number) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await smilesToSvg(smiles, width, height))}`;
}
