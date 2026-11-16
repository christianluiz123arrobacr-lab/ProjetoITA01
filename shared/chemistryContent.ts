import { z } from "zod";

export const MAX_CHEMISTRY_BLOCKS = 100;
const unsafeMarkup = /<\/?(?:script|svg|iframe|object|embed|style|link|img)\b|javascript\s*:|data\s*:\s*text\/html|https?:\/\/|www\./i;
const unsafeLatex = /\\(?:href|url|includegraphics|html(?:Class|Id|Style|Data)?|class|style|data|require|def|gdef|newcommand)\b/i;

const safeString = (max: number, label: string) => z.string().trim().min(1, `${label} vazio`).max(max, `${label} muito longo`).refine((value) => !unsafeMarkup.test(value), `${label} contém conteúdo externo ou marcação não permitida`);
export const safeResolutionTextSchema = safeString(20000, "Texto");
export const safeChemistryLatexSchema = safeString(5000, "Fórmula").refine((value) => !unsafeLatex.test(value), "Comando LaTeX não permitido");
export const safeSmilesSchema = safeString(512, "SMILES").refine((value) => !/[<>\\]/.test(value), "SMILES contém caracteres não permitidos");

export const chemistryResolutionBlockSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("texto"), conteudo: safeResolutionTextSchema }).strict(),
  z.object({ tipo: z.literal("formula"), latex: safeChemistryLatexSchema }).strict(),
  z.object({ tipo: z.literal("equacao_quimica"), latex: safeChemistryLatexSchema }).strict(),
  z.object({ tipo: z.literal("molecula"), smiles: safeSmilesSchema, legenda: safeString(300, "Legenda").optional() }).strict(),
]);

export const chemistryResolutionSchema = z.object({
  tipo: z.literal("resolucao_quimica"),
  blocos: z.array(chemistryResolutionBlockSchema).min(1).max(MAX_CHEMISTRY_BLOCKS),
}).strict();

export type ChemistryResolutionBlock = z.infer<typeof chemistryResolutionBlockSchema>;

export function parseStoredChemistryBlock(block: { tipo: string; texto?: string | null }) : ChemistryResolutionBlock | null {
  if (block.tipo === "equacao_quimica") return chemistryResolutionBlockSchema.safeParse({ tipo: block.tipo, latex: block.texto }).data ?? null;
  if (block.tipo === "molecula") {
    try {
      const value = JSON.parse(block.texto || "null");
      return chemistryResolutionBlockSchema.safeParse({ tipo: "molecula", ...value }).data ?? null;
    } catch { return null; }
  }
  return null;
}
