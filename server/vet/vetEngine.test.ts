import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVetEngineResult, normalizeVetText, type VetAttempt, type VetProfile } from "../../shared/vet/vetEngine";
import { filterVetQuestionPool, matchesVetExam, matchesVetSubject, prioritizeVetCandidates } from "./vetQuestionSelection";
import { isMissingVetSchemaError } from "./vetService";

const profile: VetProfile = { target_exam: "AFA", months_until_exam: 3, hours_per_day: 3, focus_subject: "fisica" };
const question = (id: string, topic: string, year: number, difficulty = "medio") => ({
  id, subject: "fisica", topic, topics: [topic], exam: "AFA", institution: "AFA", year,
  difficulty, statement: "", options: [], correctOptionId: "", explanation: "", tags: [], isPublished: true,
} as any);
const attempt = (id: string, topic: string, correct: boolean, daysAgo = 2): VetAttempt => ({
  id, user_id: "11111111-1111-4111-8111-111111111111", question_id: id,
  is_correct: correct, subject: "fisica", conteudo: topic, difficulty: "medio",
  time_spent_seconds: 120, answered_at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
});

describe("VET canônico", () => {
  it("mantém score em 0..100 e histórico de cinco anos acima de conteúdo raro", () => {
    const questions = [2022,2023,2024,2025,2026].map((year, i) => question(`a${i}`, "dinamica", year))
      .concat([question("b1", "optica", 2022)]);
    const result = buildVetEngineResult({ profile, attempts: [], questions, weights: [] });
    const dynamics = result.strategicContents.find(item => item.conteudo === "dinamica")!;
    const optics = result.strategicContents.find(item => item.conteudo === "optica")!;
    expect(dynamics.historical!.recurrenceRate).toBe(1);
    expect(dynamics.priorityScore).toBeGreaterThan(optics.priorityScore);
    expect(result.strategicContents.every(item => item.priorityScore >= 0 && item.priorityScore <= 100)).toBe(true);
  });

  it("trata um único ano com tendência neutra e baixa confiança", () => {
    const result = buildVetEngineResult({ profile, attempts: [], questions: [question("one", "ondas", 2026)], weights: [] });
    expect(result.historicalMetrics[0]).toMatchObject({ trendScore: 5, confidence: "low", totalYearsAnalyzed: 5 });
  });

  it("não transforma 1/1 em diagnóstico confiável", () => {
    const result = buildVetEngineResult({ profile, attempts: [attempt("q1", "dinamica", true)], questions: [question("q1", "dinamica", 2026)], weights: [] });
    expect(result.diagnosticConfidence.level).toBe("initial");
    expect(result.diagnosticConfidence.score).toBeLessThan(30);
  });

  it("erros recentes e recorrentes aumentam prioridade e aparecem no breakdown", () => {
    const attempts = [attempt("q1", "dinamica", false), attempt("q1", "dinamica", false, 3), attempt("q2", "dinamica", false, 5)];
    const result = buildVetEngineResult({ profile, attempts, questions: [question("q1", "dinamica", 2026)], weights: [] });
    const item = result.strategicContents[0];
    expect(item.scoreBreakdown.recentErrors).toBeGreaterThan(0);
    expect(item.scoreBreakdown.recurringErrors).toBeGreaterThan(0);
    expect(item.hasAdministrativeWeight).toBe(false);
    expect(item.explanation.join(" ")).toContain("Peso padrão");
  });

  it("aceita aliases explícitos sem merge agressivo", () => {
    expect(normalizeVetText("Academia da Força Aérea")).toBe("afa");
    expect(normalizeVetText("Função do Segundo Grau")).toBe("funcao quadratica");
    expect(normalizeVetText("Função Exponencial")).toBe("funcao exponencial");
  });

  it("frontend envia somente a resposta e backend usa RPC canônica", () => {
    const client = readFileSync(new URL("../../client/src/components/InteractiveQuiz.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    expect(client).not.toContain("isCorrect: correct");
    expect(client).not.toContain("subject: question.subject");
    expect(client).toContain('type="button"');
    expect(client).toContain("aria-busy={isSubmitting}");
    expect(client).toContain("Não foi possível registrar a alternativa.");
    expect(router).toContain('rpc("record_canonical_question_attempt"');
    expect(router).not.toMatch(/recordAttempt:[\s\S]{0,900}isCorrect: z\.boolean/);
  });

  it("migration fecha escrita direta, serializa attempt_number e persiste simulados", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/202608020001_harden_vet.sql", import.meta.url), "utf8");
    expect(sql).toContain("revoke insert, update, delete on public.user_question_attempts from authenticated");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("create table if not exists public.vet_mock_sessions");
    expect(sql).toContain("create table if not exists public.vet_mock_session_items");
    expect(sql).toContain("having count(*) >= 10 and count(distinct user_id) >= 5");
  });

  it("listagem pública omite gabarito e resolução", () => {
    const service = readFileSync(new URL("./vetService.ts", import.meta.url), "utf8");
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    expect(service.match(/safeQuestionDto[\s\S]*?\n}/)?.[0]).not.toContain("alternativa_correta");
    expect(router).toContain("return (data ?? []).map(safeQuestionDto)");
  });

  it("isola estatísticas de perfil no usuário autenticado", () => {
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    const start = router.indexOf("getProfileStats: protectedProcedure");
    const end = router.indexOf("\n    }),\n  }),", start);
    const procedure = router.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(procedure).toContain('.eq("user_id", ctx.user.id)');
    expect(procedure).not.toContain('.select("*")\n          .order');
    expect(procedure).toContain('.select("id, nome, avatar_key")');
    expect(procedure).not.toContain("nome, email");
    expect(procedure).not.toContain("avatar_key, ativo");
  });

  it("usa exclusivamente os itens persistidos e sua posição no simulado", () => {
    const page = readFileSync(new URL("../../client/src/pages/VetMockPage.tsx", import.meta.url), "utf8");
    expect(page).toContain("utils.vet.getMockSession.fetch({ sessionId })");
    expect(page).toContain("a.position - b.position");
    expect(page).toContain("async function startSession");
    expect(page).not.toMatch(/buildMockQuestions|buildVetEngineResult|mixedQuestions|currentQuestions/);
    expect(page).not.toContain("sessionStorage");
  });

  it("resultado persistido depende do sessionId e nunca de sessionStorage", () => {
    const page = readFileSync(new URL("../../client/src/pages/VetMockResultPage.tsx", import.meta.url), "utf8");
    expect(page).toContain("trpcClient.vet.getMockResult.query({ sessionId })");
    expect(page).toContain("if (!sessionId)");
    expect(page).toContain("Abra o resultado pelo histórico do Simulado VET");
    expect(page).not.toContain("sessionStorage");
  });

  it("filtra o pool do simulado por prova-alvo e disciplina com aliases", () => {
    const pool = [
      { id: "afa-fisica", banca: "Academia da Força Aérea", disciplina: "Física" },
      { id: "afa-matematica", banca: "AFA", disciplina: "Matemática" },
      { id: "epcar-fisica", banca: "EPCAr", disciplina: "fisica" },
    ];
    expect(filterVetQuestionPool(pool, "AFA", "fisica").map(item => item.id)).toEqual(["afa-fisica"]);
    expect(matchesVetExam({ id: "q", instituição: "Escola Preparatória de Cadetes do Ar" }, "EPCAR")).toBe(true);
    expect(matchesVetSubject({ id: "q", disciplina: "FÍSICA" }, "fisica")).toBe(true);
  });

  it("mantém não respondidas primeiro sem cruzar prova ou disciplina no fallback", () => {
    const eligible = filterVetQuestionPool([
      { id: "respondida", banca: "AFA", disciplina: "Física" },
      { id: "nova", banca: "Academia da Força Aérea", disciplina: "fisica" },
      { id: "outra-prova", banca: "EPCAr", disciplina: "Física" },
      { id: "outra-disciplina", banca: "AFA", disciplina: "Matemática" },
    ], "AFA", "Física");
    const ordered = prioritizeVetCandidates(eligible, new Set(["respondida"]), id => id === "nova" ? 2 : 1);
    expect(ordered.map(item => item.id)).toEqual(["nova", "respondida"]);
    expect(new Set(ordered.map(item => item.id)).size).toBe(ordered.length);
  });

  it("bloqueia questão externa e resposta duplicada em sessão VET", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/202608020002_finalize_vet_security.sql", import.meta.url), "utf8");
    expect(sql).toContain("question does not belong to mock session");
    expect(sql).toContain("mock question already answered");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(sql).toContain("status in ('draft','in_progress')");
  });

  it("preserva limiares privados e audita atualização coletiva", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/202608020002_finalize_vet_security.sql", import.meta.url), "utf8");
    const router = readFileSync(new URL("../routers.ts", import.meta.url), "utf8");
    expect(sql).toContain("having count(*) >= 10 and count(distinct user_id) >= 5");
    expect(sql).toContain("vet_collective_stats_refreshed");
    expect(router).toContain("getCollectiveStatsStatus: adminProcedure");
    expect(router).toContain('updateMode: "manual"');
  });

  it("mantém o motor canônico compartilhado e o backend como executor", () => {
    const service = readFileSync(new URL("./vetService.ts", import.meta.url), "utf8");
    const facade = readFileSync(new URL("../../client/src/lib/vetEngine.ts", import.meta.url), "utf8");
    expect(service).toContain('../../shared/vet/vetEngine.js');
    expect(facade).toContain('export * from "../../../shared/vet/vetEngine";');
  });

  it("trata rollout incompleto do schema VET sem derrubar o diagnóstico", () => {
    expect(isMissingVetSchemaError({ code: "PGRST205" })).toBe(true);
    expect(isMissingVetSchemaError({ code: "PGRST204" })).toBe(true);
    expect(isMissingVetSchemaError({ code: "42P01" })).toBe(true);
    expect(isMissingVetSchemaError({ code: "42703" })).toBe(true);
    expect(isMissingVetSchemaError({ code: "42501" })).toBe(false);

    const service = readFileSync(new URL("./vetService.ts", import.meta.url), "utf8");
    expect(service).toContain("Compatibility with the historical attempts table");
    expect(service).toContain("weightsResult.error ? []");
    expect(service).toContain("collectiveResult.error ? []");
  });
});
