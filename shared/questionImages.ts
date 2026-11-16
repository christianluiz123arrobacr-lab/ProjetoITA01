import { z } from "zod";

export type StatementImage = {
  slot_id: string;
  local: "enunciado" | "contexto";
  url_imagem: string;
  ordem: number;
  texto_alternativo: string;
  legenda?: string | null;
};

export function isQuestionImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
const metadataText = z
  .string()
  .trim()
  .max(500)
  .refine(
    text => !/<[^>]*>|javascript:|data:/i.test(text),
    "Use somente texto nos metadados."
  );
export const questionImageMetadataSchema = z
  .object({
    slot_id: z.string().trim().min(1).max(100).optional(),
    local: z
      .enum(["enunciado", "contexto", "alternativa", "resolucao"])
      .optional(),
    alternativa: z.enum(["a", "b", "c", "d", "e"]).nullable().optional(),
    texto_alternativo: metadataText.optional(),
    legenda: metadataText.nullable().optional(),
    url_imagem: z
      .string()
      .max(2048)
      .refine(isQuestionImageUrl, "URL de imagem inválida.")
      .optional(),
    ordem: z.number().int().min(0).max(100).optional(),
  })
  .passthrough()
  .superRefine((item, context) => {
    if (
      item.url_imagem &&
      (!item.slot_id || !item.local || item.ordem === undefined)
    )
      context.addIssue({
        code: "custom",
        message: "Informe slot, localização e ordem de cada imagem.",
      });
  });
export const questionImageMetadataListSchema = z
  .array(questionImageMetadataSchema)
  .max(100)
  .superRefine((items, context) => {
    if (items.filter(item => item.local === "enunciado" || item.local === "contexto").length > 30) context.addIssue({ code: "custom", message: "Use no máximo 30 imagens no enunciado." });
    const ids = new Set<string>();
    for (const item of items)
      if (item.slot_id) {
        if (ids.has(item.slot_id))
          context.addIssue({ code: "custom", message: "slot_id duplicado." });
        ids.add(item.slot_id);
      }
  });

/** The ordered list is canonical; url_imagem is used only for legacy rows. */
export function getStatementImages(
  metadata: unknown,
  fallback?: string | null,
  alt?: string | null,
  caption?: string | null
): StatementImage[] {
  const items: unknown[] = Array.isArray(metadata) ? metadata : [];
  const images = items
    .flatMap((value, index) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      if (
        (item.local !== "enunciado" && item.local !== "contexto") ||
        !isQuestionImageUrl(item.url_imagem)
      )
        return [];
      return [
        {
          slot_id: String(item.slot_id || `imagem-${index + 1}`),
          local: item.local,
          url_imagem: item.url_imagem,
          ordem: typeof item.ordem === "number" ? item.ordem : index,
          texto_alternativo:
            typeof item.texto_alternativo === "string"
              ? item.texto_alternativo
              : "Imagem da questão",
          legenda: typeof item.legenda === "string" ? item.legenda : null,
        } as StatementImage,
      ];
    })
    .sort((a, b) => a.ordem - b.ordem);
  if (images.length) return images;
  const legacy = items.find(
    item =>
      item &&
      typeof item === "object" &&
      ["enunciado", "contexto"].includes((item as any).local)
  ) as any;
  return isQuestionImageUrl(fallback)
    ? [
        {
          slot_id: legacy?.slot_id || "imagem-legada",
          local: legacy?.local === "contexto" ? "contexto" : "enunciado",
          url_imagem: fallback,
          ordem: 0,
          texto_alternativo:
            alt || legacy?.texto_alternativo || "Imagem da questão",
          legenda: caption || legacy?.legenda || null,
        },
      ]
    : [];
}

export function replaceStatementImages(
  metadata: unknown,
  images: StatementImage[]
) {
  const other = Array.isArray(metadata)
    ? metadata.filter(
        item => item && item.local !== "enunciado" && item.local !== "contexto"
      )
    : [];
  return [...other, ...images.map((image, ordem) => ({ ...image, ordem }))];
}

/** Keep in-progress URL edits visible; validation happens before persistence. */
export function getEditableStatementImages(
  metadata: unknown,
  fallback?: string | null
): StatementImage[] {
  const images = Array.isArray(metadata)
    ? metadata.filter(
        item =>
          item &&
          ["enunciado", "contexto"].includes(item.local) &&
          typeof item.url_imagem === "string"
      )
    : [];
  return images.length
    ? [...images].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    : getStatementImages(metadata, fallback);
}

export function normalizeQuestionImagePayload(payload: Record<string, any>) {
  if (!("image_metadata" in payload)) return payload;
  const image_metadata = questionImageMetadataListSchema.parse(
    payload.image_metadata
  );
  const statementImages = getStatementImages(
    image_metadata,
    payload.url_imagem
  );
  return {
    ...payload,
    image_metadata,
    url_imagem: statementImages[0]?.url_imagem ?? null,
  };
}

/** Explicit public allowlist: metadata cannot become a side channel for answers. */
export function publicQuestionImageMetadata(metadata: unknown) {
  const keys = [
    "slot_id",
    "local",
    "alternativa",
    "texto_alternativo",
    "legenda",
    "url_imagem",
    "ordem",
  ];
  return Array.isArray(metadata)
    ? metadata
        .filter(item => item && typeof item === "object")
        .map(item =>
          Object.fromEntries(
            Object.entries(item).filter(
              ([key, value]) =>
                keys.includes(key) &&
                (key === "ordem" ? typeof value === "number" && Number.isFinite(value) : typeof value === "string" || value === null) &&
                (key !== "url_imagem" || isQuestionImageUrl(value))
            )
          )
        )
    : [];
}
