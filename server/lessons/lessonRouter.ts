import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { LESSON_SCHEMA_VERSION, lessonJsonSchema, lessonMetadataSchema } from "../../shared/lessonSchema.js";
import { adminProcedure, platformAccessProcedure, router } from "../_core/trpc.js";
import { supabaseAdmin } from "../_core/supabaseAdmin.js";
import { validateLessonContent, validateLessonForPublication, validateLessonImport } from "./lessonValidation.js";

type QuestionTaxonomyRow = {
  disciplina?: unknown; conteudo?: unknown; conteudos?: unknown;
  assunto?: unknown; assuntos?: unknown; assuntos_por_conteudo?: unknown;
};

type CanonicalTaxonomy = Array<{ name: string; contents: Array<{ name: string; subjects: string[] }> }>;

const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map(item => item.trim())
  : typeof value === "string" && value.trim() ? [value.trim()] : [];

export function buildCanonicalLessonTaxonomy(rows: QuestionTaxonomyRow[]): CanonicalTaxonomy {
  const disciplines = new Map<string, Map<string, Set<string>>>();
  for (const row of rows) {
    const discipline = strings(row.disciplina)[0];
    if (!discipline) continue;
    const contents = Array.from(new Set(strings(row.conteudos).concat(strings(row.conteudo))));
    const looseSubjects = Array.from(new Set(strings(row.assuntos).concat(strings(row.assunto))));
    const grouped = Array.isArray(row.assuntos_por_conteudo) ? row.assuntos_por_conteudo : [];
    const byContent = disciplines.get(discipline) ?? new Map<string, Set<string>>();
    disciplines.set(discipline, byContent);
    for (const content of contents) {
      const subjectSet = byContent.get(content) ?? new Set<string>();
      byContent.set(content, subjectSet);
      for (const subject of looseSubjects) subjectSet.add(subject);
    }
    for (const item of grouped) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const content = strings(record.conteudo)[0];
      if (!content) continue;
      const subjectSet = byContent.get(content) ?? new Set<string>();
      byContent.set(content, subjectSet);
      for (const subject of strings(record.assuntos)) subjectSet.add(subject);
    }
  }
  return Array.from(disciplines.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR")).map(([name, contentMap]) => ({
    name,
    contents: Array.from(contentMap.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR")).map(([content, subjects]) => ({
      name: content,
      subjects: Array.from(subjects).sort((a, b) => a.localeCompare(b, "pt-BR")),
    })),
  }));
}

async function loadTaxonomy(): Promise<CanonicalTaxonomy> {
  const { data, error } = await supabaseAdmin.from("questoes")
    .select("disciplina,conteudo,conteudos,assunto,assuntos,assuntos_por_conteudo");
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar a taxonomia de conteúdo." });
  return buildCanonicalLessonTaxonomy((data ?? []) as QuestionTaxonomyRow[]);
}

function key(value: string) { return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"); }

export function resolveLessonTaxonomy(taxonomy: CanonicalTaxonomy, input: { discipline: string; content: string; subject: string }) {
  const discipline = taxonomy.find(item => key(item.name) === key(input.discipline));
  const content = discipline?.contents.find(item => key(item.name) === key(input.content));
  const subject = content?.subjects.find(item => key(item) === key(input.subject));
  return discipline && content && subject ? { discipline: discipline.name, content: content.name, subject } : null;
}

async function canonicalMetadata(input: z.infer<typeof lessonMetadataSchema>) {
  const taxonomy = await loadTaxonomy();
  const canonical = resolveLessonTaxonomy(taxonomy, input);
  if (!canonical) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Disciplina, conteúdo ou assunto não pertence à taxonomia canônica." });
  }
  return { ...input, ...canonical };
}

function validationError(issues: Array<{ path: string; message: string }>): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: "A aula contém campos inválidos.", cause: { issues } });
}

const lessonIdInput = z.object({ lessonId: z.string().uuid() });

export const lessonRouter = router({
  taxonomy: adminProcedure.query(() => loadTaxonomy()),

  list: adminProcedure.input(z.object({ search: z.string().max(180).default(""), discipline: z.string().max(120).default(""), status: z.enum(["all", "draft", "published", "archived"]).default("all") })).query(async ({ input }) => {
    let query = supabaseAdmin.from("lessons").select("id,slug,title,description,discipline,content,subject,level,display_order,updated_at,archived_at,current_published_version_id,lesson_versions!lessons_current_published_version_fk(version_number)").order("updated_at", { ascending: false });
    if (input.search.trim()) query = query.ilike("title", `%${input.search.trim()}%`);
    if (input.discipline) query = query.eq("discipline", input.discipline);
    if (input.status === "archived") query = query.not("archived_at", "is", null);
    else {
      query = query.is("archived_at", null);
      if (input.status === "draft") query = query.is("current_published_version_id", null);
      if (input.status === "published") query = query.not("current_published_version_id", "is", null);
    }
    const { data, error } = await query;
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível listar as aulas." });
    return data ?? [];
  }),

  create: adminProcedure.input(lessonMetadataSchema).mutation(async ({ ctx, input }) => {
    const metadata = await canonicalMetadata(input);
    const { data: lesson, error } = await supabaseAdmin.from("lessons").insert({
      slug: metadata.slug, title: metadata.title, description: metadata.description,
      discipline: metadata.discipline, content: metadata.content, subject: metadata.subject,
      level: metadata.level ?? null, display_order: metadata.displayOrder, created_by: ctx.user.id,
    }).select("id").single();
    if (error || !lesson) throw new TRPCError({ code: error?.code === "23505" ? "CONFLICT" : "BAD_REQUEST", message: error?.code === "23505" ? "Este slug já está em uso." : "Não foi possível criar a aula." });
    const empty = { schemaVersion: LESSON_SCHEMA_VERSION, blocks: [] };
    const { error: draftError } = await supabaseAdmin.from("lesson_drafts").insert({ lesson_id: lesson.id, schema_version: LESSON_SCHEMA_VERSION, content_json: empty, updated_by: ctx.user.id });
    if (draftError) {
      await supabaseAdmin.from("lessons").delete().eq("id", lesson.id);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar o rascunho da aula." });
    }
    return { id: String(lesson.id) };
  }),

  getAdmin: adminProcedure.input(lessonIdInput).query(async ({ input }) => {
    const [{ data: lesson, error }, { data: draft, error: draftError }] = await Promise.all([
      supabaseAdmin.from("lessons").select("*").eq("id", input.lessonId).maybeSingle(),
      supabaseAdmin.from("lesson_drafts").select("*").eq("lesson_id", input.lessonId).maybeSingle(),
    ]);
    if (error || draftError) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar a aula." });
    if (!lesson || !draft) throw new TRPCError({ code: "NOT_FOUND", message: "Aula não encontrada." });
    return { lesson, draft };
  }),

  saveDraft: adminProcedure.input(z.object({ lessonId: z.string().uuid(), metadata: lessonMetadataSchema, content: lessonJsonSchema })).mutation(async ({ ctx, input }) => {
    const validated = validateLessonContent(input.content);
    if (!validated.success) validationError(validated.issues);
    const metadata = await canonicalMetadata(input.metadata);
    const { error: lessonError } = await supabaseAdmin.from("lessons").update({
      slug: metadata.slug, title: metadata.title, description: metadata.description,
      discipline: metadata.discipline, content: metadata.content, subject: metadata.subject,
      level: metadata.level ?? null, display_order: metadata.displayOrder,
    }).eq("id", input.lessonId).is("archived_at", null);
    if (lessonError) throw new TRPCError({ code: lessonError.code === "23505" ? "CONFLICT" : "BAD_REQUEST", message: lessonError.code === "23505" ? "Este slug já está em uso." : "Não foi possível salvar os metadados." });
    const { error } = await supabaseAdmin.from("lesson_drafts").update({ schema_version: validated.data.schemaVersion, content_json: validated.data, updated_by: ctx.user.id, updated_at: new Date().toISOString() }).eq("lesson_id", input.lessonId);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível salvar o rascunho." });
    return { success: true, updatedAt: new Date().toISOString() };
  }),

  validateImport: adminProcedure.input(z.object({ document: z.unknown() })).mutation(async ({ input }) => {
    const result = validateLessonImport(input.document);
    if (!result.success) return { valid: false as const, document: null, issues: result.issues };
    try {
      const metadata = await canonicalMetadata(result.data.metadata);
      return { valid: true as const, document: { ...result.data, metadata }, issues: [] };
    } catch {
      return { valid: false as const, document: null, issues: [{ path: "metadata", message: "A taxonomia informada não existe no Projeto Vetor." }] };
    }
  }),

  validateDraft: adminProcedure.input(z.object({ metadata: lessonMetadataSchema, content: z.unknown() })).mutation(async ({ input }) => {
    const content = validateLessonContent(input.content);
    if (!content.success) return { valid: false as const, issues: content.issues };
    try {
      await canonicalMetadata(input.metadata);
      return { valid: true as const, issues: [] };
    } catch {
      return { valid: false as const, issues: [{ path: "metadata", message: "A taxonomia informada não existe no Projeto Vetor." }] };
    }
  }),

  publish: adminProcedure.input(z.object({ lessonId: z.string().uuid(), changeNote: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    const [{ data: draft, error }, { data: lesson, error: lessonError }] = await Promise.all([
      supabaseAdmin.from("lesson_drafts").select("schema_version,content_json,updated_at").eq("lesson_id", input.lessonId).maybeSingle(),
      supabaseAdmin.from("lessons").select("title,slug,description,discipline,content,subject,level,display_order").eq("id", input.lessonId).is("archived_at", null).maybeSingle(),
    ]);
    if (error || lessonError || !draft || !lesson) throw new TRPCError({ code: "NOT_FOUND", message: "Rascunho não encontrado." });
    await canonicalMetadata({ title: lesson.title, slug: lesson.slug, description: lesson.description, discipline: lesson.discipline, content: lesson.content, subject: lesson.subject, level: lesson.level, displayOrder: lesson.display_order });
    const validated = validateLessonForPublication(draft.content_json);
    if (!validated.success) validationError(validated.issues);
    const { data, error: publishError } = await supabaseAdmin.rpc("lesson_publish", { p_lesson_id: input.lessonId, p_actor_id: ctx.user.id, p_expected_draft_updated_at: draft.updated_at, p_change_note: input.changeNote ?? null });
    if (publishError || !data?.[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível publicar a aula." });
    return { versionId: String(data[0].version_id), versionNumber: Number(data[0].version_number) };
  }),

  history: adminProcedure.input(lessonIdInput).query(async ({ input }) => {
    const { data, error } = await supabaseAdmin.from("lesson_versions").select("id,version_number,schema_version,published_by,published_at,restored_from_version_id,change_note").eq("lesson_id", input.lessonId).order("version_number", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar o histórico." });
    return data ?? [];
  }),

  restore: adminProcedure.input(z.object({ lessonId: z.string().uuid(), versionId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await supabaseAdmin.rpc("lesson_restore_draft", { p_lesson_id: input.lessonId, p_version_id: input.versionId, p_actor_id: ctx.user.id });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível restaurar esta versão no rascunho." });
    return { success: true };
  }),

  archive: adminProcedure.input(z.object({ lessonId: z.string().uuid(), archived: z.boolean() })).mutation(async ({ input }) => {
    const { error } = await supabaseAdmin.from("lessons").update({ archived_at: input.archived ? new Date().toISOString() : null }).eq("id", input.lessonId);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: "Não foi possível atualizar o arquivamento." });
    return { success: true };
  }),

  published: platformAccessProcedure.input(z.object({ slug: z.string().trim().min(1).max(180) })).query(async ({ input }) => {
    const { data: lesson, error } = await supabaseAdmin.from("lessons").select("id,slug,title,description,discipline,content,subject,level,current_published_version_id").eq("slug", input.slug).is("archived_at", null).not("current_published_version_id", "is", null).maybeSingle();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar a aula." });
    if (!lesson?.current_published_version_id) throw new TRPCError({ code: "NOT_FOUND", message: "Aula publicada não encontrada." });
    const { data: version, error: versionError } = await supabaseAdmin.from("lesson_versions").select("version_number,schema_version,content_json,published_at").eq("id", lesson.current_published_version_id).eq("lesson_id", lesson.id).maybeSingle();
    if (versionError || !version) throw new TRPCError({ code: "NOT_FOUND", message: "Aula publicada não encontrada." });
    const validated = validateLessonForPublication(version.content_json);
    if (!validated.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "O conteúdo desta aula está temporariamente indisponível." });
    return { lesson, version: { ...version, content_json: validated.data } };
  }),
});
