import { chemistryResolutionBlockSchema } from "../../shared/chemistryContent.js";

export function normalizeResolutionBlockPayload(
  questaoId: string,
  block: {
    tipo: string;
    texto?: string | null;
    url_imagem?: string | null;
    ordem: number;
    smiles?: string;
    legenda?: string;
  }
) {
  if (block.tipo === "equacao_quimica") {
    const parsed = chemistryResolutionBlockSchema.options[2].parse({
      tipo: "equacao_quimica",
      latex: block.texto,
    });
    return {
      questao_id: questaoId,
      tipo: block.tipo,
      texto: parsed.latex,
      url_imagem: null,
      ordem: block.ordem,
    };
  }
  if (block.tipo === "molecula") {
    let source: unknown = { smiles: block.smiles, legenda: block.legenda };
    if (!block.smiles && block.texto) {
      try {
        source = JSON.parse(block.texto);
      } catch {
        source = {};
      }
    }
    const parsed = chemistryResolutionBlockSchema.options[3].parse({
      tipo: "molecula",
      ...(source as object),
    });
    return {
      questao_id: questaoId,
      tipo: block.tipo,
      texto: JSON.stringify({
        smiles: parsed.smiles,
        ...(parsed.legenda ? { legenda: parsed.legenda } : {}),
      }),
      url_imagem: null,
      ordem: block.ordem,
    };
  }
  return {
    questao_id: questaoId,
    tipo: block.tipo,
    texto: block.texto?.trim() || null,
    url_imagem:
      block.tipo === "imagem" ? block.url_imagem?.trim() || null : null,
    ordem: block.ordem,
  };
}
