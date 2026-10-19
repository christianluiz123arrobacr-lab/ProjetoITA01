import { z } from "zod";
import {
  normalizeQuestionImagePayload,
  questionImageMetadataListSchema,
} from "./questionImages.js";

// Internal publication (publicada) is editorial. SEO publication is intentionally
// absent: only setPublicQuestionPublication may change its server-owned fields.
const text = z.string().max(20000).nullable().optional();
const label = z.string().max(500).nullable().optional();
const editorialFields = {
  codigo: label,
  disciplina: label,
  conteudo: label,
  assunto: label,
  conteudos: z.array(z.string().max(500)).max(100).optional(),
  assuntos: z.array(z.string().max(500)).max(200).optional(),
  assuntos_por_conteudo: z
    .array(
      z
        .object({
          conteudo: z.string().max(500),
          assuntos: z.array(z.string().max(500)).max(200),
        })
        .strict()
    )
    .max(100)
    .optional(),
  banca: label,
  ano: z.number().int().min(1900).max(2200).nullable().optional(),
  dificuldade: z
    .enum(["facil", "medio", "dificil", "muito_dificil"])
    .optional(),
  instituição: label,
  publicada: z.boolean().optional(),
  enunciado: text,
  enunciado_pos_imagem: text,
  formula: text,
  url_imagem: z.string().max(2048).nullable().optional(),
  A: text,
  B: text,
  C: text,
  D: text,
  E: text,
  a_url_imagem: z.string().max(2048).nullable().optional(),
  b_url_imagem: z.string().max(2048).nullable().optional(),
  c_url_imagem: z.string().max(2048).nullable().optional(),
  d_url_imagem: z.string().max(2048).nullable().optional(),
  e_url_imagem: z.string().max(2048).nullable().optional(),
  image_metadata: questionImageMetadataListSchema.optional(),
  alternativa_correta: z
    .enum(["a", "b", "c", "d", "e", "A", "B", "C", "D", "E"])
    .nullable()
    .optional(),
};

export const questionEditorialSchema = z
  .object(editorialFields)
  .strict()
  .refine(
    value => Object.keys(value).length > 0,
    "Informe campos editoriais; campos administrativos não são permitidos."
  );

/** Explicitly rebuild after normalization too; no original request spread reaches SQL. */
export function buildQuestionEditorialPayload(
  input: z.infer<typeof questionEditorialSchema>
) {
  const normalized = normalizeQuestionImagePayload(input);
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(editorialFields)) {
    if (
      Object.prototype.hasOwnProperty.call(normalized, key) &&
      normalized[key] !== undefined
    )
      result[key] = normalized[key];
  }
  return result;
}
