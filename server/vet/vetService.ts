import { TRPCError } from "@trpc/server";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { buildVetEngineResult, normalizeVetText, type VetProfile } from "../../shared/vet/vetEngine.js";

export const VET_ENGINE_VERSION = "vet-2.0";

type SupabaseLikeError = { code?: string | null; message?: string | null } | null;

export function isMissingVetSchemaError(error: SupabaseLikeError) {
  return ["42P01", "42703", "PGRST204", "PGRST205"].includes(String(error?.code ?? ""));
}

function publicQuestionForEngine(row: any) {
  return {
    id: String(row.id), codigo: row.codigo ?? undefined,
    subject: row.disciplina ?? "nao informado",
    topic: row.conteudos?.[0] ?? row.conteudo ?? row.assunto ?? "",
    topics: Array.isArray(row.conteudos) && row.conteudos.length ? row.conteudos : [row.conteudo ?? row.assunto].filter(Boolean),
    subtopic: row.assuntos?.[0] ?? row.assunto ?? undefined,
    subtopics: Array.isArray(row.assuntos) ? row.assuntos : [row.assunto].filter(Boolean),
    exam: row.banca ?? "Sem banca", institution: row.instituição ?? undefined,
    year: Number(row.ano ?? 0), difficulty: row.dificuldade ?? "medio",
    statement: "", options: [], correctOptionId: "", explanation: "", tags: [], isPublished: true,
  } as any;
}

export async function getCanonicalVetAnalysis(userId: string) {
  const { data: profile, error: profileError } = await supabaseAdmin.from("user_vet_profiles").select("*").eq("user_id", userId).maybeSingle();
  // An environment that has not received the VET migrations yet must show the
  // normal "configure objective" state instead of crashing the diagnosis page.
  if (profileError && isMissingVetSchemaError(profileError)) return null;
  if (profileError) throw new TRPCError({ code: "BAD_REQUEST", message: profileError.message });
  if (!profile?.target_exam) return null;

  let questionQuery = supabaseAdmin.from("questoes")
    .select("id,codigo,disciplina,assunto,conteudo,conteudos,assuntos,banca,instituição,ano,dificuldade")
    .eq("publicada", true)
    .or(`banca.eq.${profile.target_exam},instituição.eq.${profile.target_exam}`)
    .limit(10000);
  if (normalizeVetText(profile.focus_subject) !== "todas") questionQuery = questionQuery.eq("disciplina", profile.focus_subject);

  let attemptsResult = await supabaseAdmin.from("user_question_attempts").select("id,user_id,question_id,is_correct,time_spent_seconds,answered_at,attempt_number,subject,conteudo,conteudos,assunto,assuntos,banca,institution,ano,difficulty").eq("user_id", userId).order("answered_at", { ascending: false }).limit(10000);
  if (attemptsResult.error && isMissingVetSchemaError(attemptsResult.error)) {
    // Compatibility with the historical attempts table while migration 001 is
    // rolling out. These are canonical stored values, never client input.
    attemptsResult = await supabaseAdmin.from("user_question_attempts").select("id,user_id,question_id,is_correct,time_spent_seconds,answered_at,attempt_number,subject,conteudo,assunto,banca,ano,difficulty").eq("user_id", userId).order("answered_at", { ascending: false }).limit(10000) as typeof attemptsResult;
  }
  const attemptsUnavailable = Boolean(attemptsResult.error && isMissingVetSchemaError(attemptsResult.error));
  const [questionsResult, weightsResult, collectiveResult] = await Promise.all([
    questionQuery,
    supabaseAdmin.from("vet_exam_content_weights").select("id,exam,subject,conteudo,weight").eq("exam", profile.target_exam),
    supabaseAdmin.from("vet_content_collective_stats").select("exam,subject,conteudo,total_attempts,total_users,correct_attempts,wrong_attempts,collective_accuracy,avg_time_seconds,updated_at").eq("exam", profile.target_exam),
  ]);
  if (attemptsResult.error && !attemptsUnavailable) throw new TRPCError({ code: "BAD_REQUEST", message: attemptsResult.error.message });
  if (questionsResult.error) throw new TRPCError({ code: "BAD_REQUEST", message: questionsResult.error.message });
  if (weightsResult.error && !isMissingVetSchemaError(weightsResult.error)) throw new TRPCError({ code: "BAD_REQUEST", message: weightsResult.error.message });
  if (collectiveResult.error && !isMissingVetSchemaError(collectiveResult.error)) throw new TRPCError({ code: "BAD_REQUEST", message: collectiveResult.error.message });

  const attempts = (attemptsUnavailable ? [] : attemptsResult.data ?? []).flatMap((attempt: any) => {
    const contents = Array.isArray(attempt.conteudos) && attempt.conteudos.length ? attempt.conteudos : [attempt.conteudo].filter(Boolean);
    return contents.length ? contents.map((conteudo: string) => ({ ...attempt, conteudo })) : [attempt];
  });
  const collectiveStats = (collectiveResult.error ? [] : collectiveResult.data ?? []).map((row: any) => ({
    ...row,
    total_attempts: Number(row.total_attempts ?? 0), correct_attempts: Number(row.correct_attempts ?? 0),
    wrong_attempts: Number(row.wrong_attempts ?? 0), collective_accuracy: Number(row.collective_accuracy ?? 0),
    avg_time_seconds: row.avg_time_seconds == null ? null : Number(row.avg_time_seconds),
  }));
  const analysis = buildVetEngineResult({
    profile: profile as VetProfile,
    attempts: attempts as any,
    questions: (questionsResult.data ?? []).map(publicQuestionForEngine),
    weights: (weightsResult.error ? [] : weightsResult.data ?? []).map((row: any) => ({ ...row, weight: Number(row.weight) })),
    collectiveStats,
    yearsBack: 5,
  });
  return { ...analysis, engineVersion: VET_ENGINE_VERSION, generatedAt: new Date().toISOString(), collectiveDataAvailable: collectiveStats.length > 0 };
}

export function safeQuestionDto(row: any) {
  const option = (id: "a" | "b" | "c" | "d" | "e") => {
    const upperId = id.toUpperCase();
    const text = row[id] ?? row[upperId] ?? null;
    const imageUrl = row[`${id}_url_imagem`] ?? null;

    if (!String(text ?? "").trim() && !String(imageUrl ?? "").trim()) return null;

    return {
      id,
      label: upperId,
      text: String(text ?? "").trim() || null,
      imageUrl: String(imageUrl ?? "").trim() || null,
    };
  };

  return {
    id: row.id, codigo: row.codigo, disciplina: row.disciplina, assunto: row.assunto,
    conteudo: row.conteudo, conteudos: row.conteudos, assuntos: row.assuntos,
    assuntos_por_conteudo: row.assuntos_por_conteudo, banca: row.banca, ano: row.ano,
    dificuldade: row.dificuldade, enunciado: row.enunciado,
    enunciado_pos_imagem: row.enunciado_pos_imagem, url_imagem: row.url_imagem,
    // The historical schema stores textual alternatives in quoted uppercase
    // columns (A-E); normalize both generations at the public boundary.
    formula: row.formula,
    a: row.a ?? row.A, b: row.b ?? row.B, c: row.c ?? row.C,
    d: row.d ?? row.D, e: row.e ?? row.E,
    // Send a canonical collection as well as the legacy fields. This avoids
    // losing choices when quoted PostgreSQL column casing is normalized by an
    // intermediary JSON/TRPC serializer.
    options: (["a", "b", "c", "d", "e"] as const).map(option).filter(Boolean),
    a_url_imagem: row.a_url_imagem, b_url_imagem: row.b_url_imagem,
    c_url_imagem: row.c_url_imagem, d_url_imagem: row.d_url_imagem,
    e_url_imagem: row.e_url_imagem, instituição: row.instituição, fonte: row.fonte,
    tag: row.tag, publicada: row.publicada, created_at: row.created_at,
  };
}
