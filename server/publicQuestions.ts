import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "./_core/supabaseAdmin.js";

export const PUBLIC_SITE_ORIGIN = "https://www.projetovetor.com";
export const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PUBLIC_QUESTION_SELECT = "id,codigo,disciplina,conteudo,conteudos,assunto,assuntos,banca,ano,dificuldade,enunciado,enunciado_pos_imagem,url_imagem,formula,A,B,C,D,E,a_url_imagem,b_url_imagem,c_url_imagem,d_url_imagem,e_url_imagem,instituição,public_slug,is_public,public_noindex,public_published_at,publicada,alternativa_correta";

type PublicQuestionRow = Record<string, any>;
type ResolutionRow = { tipo?: string | null; texto?: string | null; ordem?: number | null; url_imagem?: string | null };

export type PublicQuestionRepository = {
  loadBySlug(slug: string): Promise<PublicQuestionRow | null>;
  loadRelated(slug: string, discipline: string): Promise<PublicQuestionRow[]>;
};

type PostgrestFailure = { code?: string; message?: string; hint?: string };

function publicDataError(operation: string, error: PostgrestFailure) {
  return Object.assign(new Error(`Falha de dados em ${operation}.`), {
    code: error.code,
    databaseMessage: error.message,
    hint: error.hint,
  });
}

export function isValidPublicSlug(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 140 && PUBLIC_SLUG_PATTERN.test(value);
}

export function isPubliclyEligible(row: PublicQuestionRow | null | undefined): boolean {
  return Boolean(row && row.is_public === true && row.public_noindex !== true && row.publicada === true && isValidPublicSlug(row.public_slug));
}

export function slugifyPublicPart(value: unknown, fallback: string): string {
  const normalized = String(value ?? "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 32).replace(/-+$/g, "");
  return normalized || fallback;
}

export function buildPublicSlugBase(row: PublicQuestionRow, publicCode: string): string {
  const institution = row.instituição || row.banca || "questao";
  const subject = typeof row.disciplina === "string" && row.disciplina.trim() ? row.disciplina.trim() : "estudos";
  const topic = Array.isArray(row.conteudos) ? row.conteudos[0] : row.conteudo || row.assunto || "exercicio";
  const year = Number.isInteger(row.ano) ? String(row.ano) : "geral";
  return [institution, year, subject, topic, publicCode].map((part, index) => slugifyPublicPart(part, index === 1 ? "geral" : "questao")).join("-").slice(0, 140).replace(/-+$/g, "");
}

export async function chooseUniquePublicSlug(row: PublicQuestionRow, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const code = slugifyPublicPart(row.codigo, "q").slice(-12);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const suffix = attempt === 0 && code.length >= 3 ? code : `q${randomBytes(4).toString("hex")}`;
    const candidate = buildPublicSlugBase(row, suffix);
    if (!(await exists(candidate))) return candidate;
  }
  throw new TRPCError({ code: "CONFLICT", message: "Não foi possível gerar uma URL pública única." });
}

function list(value: unknown, fallback: unknown): string[] {
  const values = Array.isArray(value) ? value : fallback ? [fallback] : [];
  return Array.from(new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean)));
}

export function safePublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function optionDto(row: PublicQuestionRow, key: "a" | "b" | "c" | "d" | "e") {
  const text = typeof row[key.toUpperCase()] === "string" ? row[key.toUpperCase()].trim() : "";
  const imageUrl = safePublicImageUrl(row[`${key}_url_imagem`]);
  return text || imageUrl ? { key, text, imageUrl } : null;
}

export function toInitialPublicQuestion(row: PublicQuestionRow, related: PublicQuestionRow[] = []) {
  if (!isPubliclyEligible(row)) throw new TRPCError({ code: "NOT_FOUND", message: "Conteúdo não disponível." });
  const discipline = typeof row.disciplina === "string" && row.disciplina.trim() ? row.disciplina.trim() : "Estudos";
  const institution = String(row.instituição || row.banca || "Projeto Vetor");
  const contents = list(row.conteudos, row.conteudo);
  const subjects = list(row.assuntos, row.assunto);
  return {
    slug: row.public_slug as string,
    title: `Questão de ${discipline} — ${institution}${row.ano ? ` ${row.ano}` : ""}`,
    institution,
    year: typeof row.ano === "number" ? row.ano : null,
    discipline,
    contents,
    subjects,
    difficulty: row.dificuldade ? String(row.dificuldade) : null,
    statement: String(row.enunciado || ""),
    statementAfterImage: String(row.enunciado_pos_imagem || ""),
    formula: String(row.formula || ""),
    imageUrl: safePublicImageUrl(row.url_imagem),
    options: (["a", "b", "c", "d", "e"] as const).map((key) => optionDto(row, key)).filter(Boolean),
    related: related.filter(isPubliclyEligible).slice(0, 3).map((item) => ({
      slug: item.public_slug as string,
      title: `Questão de ${typeof item.disciplina === "string" && item.disciplina.trim() ? item.disciplina.trim() : "Estudos"} — ${item.instituição || item.banca || "Projeto Vetor"}${item.ano ? ` ${item.ano}` : ""}`,
      topic: list(item.conteudos, item.conteudo)[0] || item.assunto || null,
    })),
  };
}

const publicQuestionRepository: PublicQuestionRepository = {
  async loadBySlug(slug) {
    const { data, error } = await supabaseAdmin.from("questoes").select(PUBLIC_QUESTION_SELECT)
      .eq("public_slug", slug).eq("is_public", true).eq("public_noindex", false).eq("publicada", true).maybeSingle();
    if (error) throw publicDataError("loadBySlug", error);
    return isPubliclyEligible(data) ? data : null;
  },
  async loadRelated(slug, discipline) {
    const { data, error } = await supabaseAdmin.from("questoes").select(PUBLIC_QUESTION_SELECT)
      .eq("is_public", true).eq("public_noindex", false).eq("publicada", true)
      .neq("public_slug", slug).eq("disciplina", discipline).limit(8);
    if (error) throw publicDataError("loadRelated", error);
    return data ?? [];
  },
};

async function loadEligibleRow(slug: string): Promise<PublicQuestionRow | null> {
  if (!isValidPublicSlug(slug)) return null;
  return publicQuestionRepository.loadBySlug(slug);
}

export async function getPublicQuestion(slug: string, repository: PublicQuestionRepository = publicQuestionRepository) {
  if (!isValidPublicSlug(slug)) return null;
  const row = await repository.loadBySlug(slug);
  if (!row) return null;
  const discipline = typeof row.disciplina === "string" ? row.disciplina.trim() : "";
  if (!discipline) return toInitialPublicQuestion(row);
  try {
    const related = await repository.loadRelated(slug, discipline);
    return toInitialPublicQuestion(row, related.sort(() => Math.random() - 0.5));
  } catch (error) {
    console.error("[public-question.related] não foi possível carregar relacionadas", {
      slug,
      operation: "loadRelated",
      code: typeof (error as any)?.code === "string" ? (error as any).code : undefined,
    });
    return toInitialPublicQuestion(row);
  }
}

export async function answerPublicQuestion(slug: string, selectedOption: string) {
  if (!/^[a-e]$/.test(selectedOption)) throw new TRPCError({ code: "BAD_REQUEST", message: "Alternativa inválida." });
  const row = await loadEligibleRow(slug);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Conteúdo não disponível." });
  const correctOption = String(row.alternativa_correta || "").trim().toLowerCase();
  if (!/^[a-e]$/.test(correctOption)) throw new TRPCError({ code: "NOT_FOUND", message: "Conteúdo não disponível." });
  const { data, error } = await supabaseAdmin.from("resolucoes").select("tipo,texto,ordem,url_imagem").eq("questao_id", row.id).order("ordem");
  if (error) throw new Error("Não foi possível carregar a resolução.");
  return buildPublicAnswer(correctOption, selectedOption, (data ?? []) as ResolutionRow[]);
}

export function buildPublicAnswer(correctOption: string, selectedOption: string, resolutionRows: ResolutionRow[]) {
  return {
    isCorrect: selectedOption === correctOption,
    correctOption,
    resolution: resolutionRows.map((block) => ({
      type: block.tipo || "texto", text: block.texto || "", imageUrl: safePublicImageUrl(block.url_imagem), order: block.ordem || 0,
    })),
  };
}

export async function registerPublicQuestionAttempt(userId: string, slug: string, selectedOption: string, timeSpentSeconds: number) {
  const row = await loadEligibleRow(slug);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Conteúdo não disponível." });
  const { data, error } = await supabaseAdmin.rpc("record_canonical_question_attempt", {
    p_user_id: userId, p_question_id: row.id, p_selected_option: selectedOption,
    p_time_spent_seconds: Math.max(1, Math.min(86400, Math.round(timeSpentSeconds))), p_vet_mock_session_id: null,
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.attempt_id) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível registrar a tentativa." });
  return { success: true, isCorrect: result.is_correct };
}

export async function listPublicSitemapEntries() {
  const { data, error } = await supabaseAdmin.from("questoes").select("public_slug,public_published_at,is_public,public_noindex,publicada")
    .eq("is_public", true).eq("public_noindex", false).eq("publicada", true).not("public_slug", "is", null).order("public_published_at");
  if (error) throw new Error("Não foi possível gerar o sitemap.");
  return (data ?? []).filter(isPubliclyEligible).map((row) => ({ slug: row.public_slug as string, lastmod: row.public_published_at as string | null }));
}

export async function setPublicQuestionPublication(questionId: string, publish: boolean, adminUserId: string) {
  const { data: rawRow, error } = await supabaseAdmin.from("questoes").select("*").eq("id", questionId).maybeSingle();
  const row = rawRow as PublicQuestionRow | null;
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Questão não encontrada." });
  const previous = { isPublic: row.is_public === true, slug: row.public_slug || null, noindex: row.public_noindex === true };
  let slug = row.public_slug as string | null;
  if (publish) {
    if (row.publicada !== true || !String(row.enunciado || "").trim() || !/^[a-e]$/i.test(String(row.alternativa_correta || ""))) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A questão precisa estar ativa, ter enunciado e gabarito válido." });
    }
    const { count } = await supabaseAdmin.from("resolucoes").select("id", { count: "exact", head: true }).eq("questao_id", questionId);
    if (!count) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Adicione e revise uma resolução antes de publicar no Google." });
    if (!slug || !isValidPublicSlug(slug)) {
      slug = await chooseUniquePublicSlug(row, async (candidate) => {
        const { count: collision } = await supabaseAdmin.from("questoes").select("id", { count: "exact", head: true }).eq("public_slug", candidate).neq("id", questionId);
        return Boolean(collision);
      });
    }
  }
  const next = { is_public: publish, public_slug: slug, public_published_at: publish ? new Date().toISOString() : row.public_published_at, public_noindex: false };
  const { error: updateError } = await supabaseAdmin.from("questoes").update(next).eq("id", questionId);
  if (updateError) throw new TRPCError({ code: updateError.code === "23505" ? "CONFLICT" : "BAD_REQUEST", message: "Não foi possível alterar a publicação pública." });
  await supabaseAdmin.from("admin_logs").insert({
    admin_user_id: adminUserId, action: publish ? "public_question_published" : "public_question_unpublished",
    entity_type: "questao", entity_id: questionId, description: publish ? "Questão publicada na página pública." : "Questão removida da página pública.", level: "info",
    metadata: { slug, previous, next: { isPublic: publish, noindex: false } },
  });
  return { isPublic: publish, publicSlug: slug, publicNoindex: false, publicUrl: slug ? `${PUBLIC_SITE_ORIGIN}/questoes/${slug}` : null };
}
