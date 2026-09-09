import { ChemicalEquation } from "./ChemicalEquation";
import { ChemicalStructure } from "./ChemicalStructure";
import { parseStoredChemistryBlock } from "@shared/chemistryContent";

export function ChemistryResolutionBlock({ block }: { block: { tipo: string; texto?: string | null } }) {
  const parsed = parseStoredChemistryBlock(block);
  if (!parsed) return null;
  if (parsed.tipo === "equacao_quimica") return <ChemicalEquation latex={parsed.latex} />;
  if (parsed.tipo === "molecula") return <ChemicalStructure smiles={parsed.smiles} caption={parsed.legenda} />;
  return null;
}
