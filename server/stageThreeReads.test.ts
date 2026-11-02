import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("./_core/supabaseAdmin.js", () => ({ supabaseAdmin: db }));
import { appRouter } from "./routers";
import { getCanonicalVetAnalysis } from "./vet/vetService";
import { readAllDatabaseRows } from "./_core/databaseRead";

const userId = "10000000-0000-4000-8000-000000000001";
const otherId = "10000000-0000-4000-8000-000000000002";
const id = (n: number) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let tables: Record<string, any[]>;
let requests: Array<{ table: string; from: number; to: number; columns: string }>;
let fail: (table: string, from: number, columns: string) => unknown;
let cap: number;
let writes: number;

// Simulates PostgREST's row cap, predicates, ordering and projections. Tests call
// the production router/engine, rather than asserting helper names in sources.
function query(table: string) {
  let columns = "*", from = 0, to = 999, limit = Infinity, single = false;
  const predicates: Array<(row: any) => boolean> = [];
  const orders: Array<{ key: string; ascending: boolean }> = [];
  const execute = () => {
    requests.push({ table, from, to, columns });
    const error = fail(table, from, columns);
    if (error instanceof Error) throw error;
    if (error) return { data: null, error };
    let rows = [...(tables[table] ?? [])].filter(row => predicates.every(predicate => predicate(row)));
    rows.sort((a, b) => {
      for (const order of orders) {
        const result = String(a[order.key] ?? "").localeCompare(String(b[order.key] ?? ""));
        if (result) return order.ascending ? result : -result;
      }
      return 0;
    });
    rows = rows.slice(from, Math.min(to + 1, from + cap, from + limit));
    if (columns !== "*") rows = rows.map(row => Object.fromEntries(columns.split(",").filter(key => key in row).map(key => [key, row[key]])));
    if (single && rows.length > 1) return { data: null, error: { code: "PGRST116" } };
    return { data: single ? rows[0] ?? null : rows, error: null };
  };
  const q: any = {
    select(value = "*") { columns = value; return q; },
    eq(key: string, value: unknown) { predicates.push(row => row[key] === value); return q; },
    gte(key: string, value: string) { predicates.push(row => row[key] >= value); return q; },
    in(key: string, values: unknown[]) { predicates.push(row => values.includes(row[key])); return q; },
    overlaps(key: string, values: unknown[]) { predicates.push(row => row[key]?.some((v: unknown) => values.includes(v))); return q; },
    or(value: string) {
      const alternatives = value.split(",").map(part => part.split(".eq."));
      predicates.push(row => alternatives.some(([key, expected]) => row[key] === expected));
      return q;
    },
    order(key: string, options?: { ascending?: boolean }) { orders.push({ key, ascending: options?.ascending !== false }); return q; },
    range(start: number, end: number) { from = start; to = end; return q; },
    limit(value: number) { limit = value; return q; },
    maybeSingle() { single = true; return q; },
    abortSignal() { return q; },
    insert() { writes++; throw new Error("Unexpected write in a read regression"); },
    then(resolve: any, reject: any) { return Promise.resolve().then(execute).then(resolve, reject); },
  };
  return q;
}

function caller(role: "student" | "editor" | "admin" | null = "student") {
  return appRouter.createCaller({
    user: role ? { id: userId, role, email: null } : null,
    validatedProfile: { userId, data: { role: role ?? "student", ativo: true } },
    req: { headers: {} }, res: {},
  } as any);
}
function seed(count = 1205) {
  const stamp = new Date().toISOString();
  tables.user_vet_profiles = [{ user_id: userId, target_exam: "ITA", focus_subject: "todas", months_until_exam: 6, hours_per_day: 3, study_days_per_week: 5 }];
  tables.questoes = Array.from({ length: count }, (_, n) => ({ id: id(n), publicada: true, disciplina: "Física", banca: "ITA", instituição: "ITA", ano: 2026, dificuldade: "medio", conteudos: ["Dinâmica"], assuntos: ["Newton"] }));
  tables.user_question_attempts = Array.from({ length: count }, (_, n) => ({ id: id(n), user_id: userId, question_id: id(n), is_correct: n % 2 === 0, selected_option: n % 2 === 0 ? "a" : "b", answered_at: stamp, time_spent_seconds: 20, subject: "Física", conteudo: "Dinâmica", banca: "ITA", difficulty: "medio" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  tables = {}; requests = []; cap = 1000; writes = 0; fail = () => null;
  db.from.mockImplementation(query);
  db.rpc.mockResolvedValue({ data: true, error: null });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  seed();
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Etapa 3: complete, authorized database reads", () => {
  it("loads more than 1000 attempts and questions into the real VET engine", async () => {
    const result = await caller().vet.getAnalysis();
    expect(result).toMatchObject({ totalAttempts: 1205, totalCorrect: 603, totalWrong: 602 });
    expect(result?.generalAccuracy).toBeCloseTo(603 / 1205 * 100);
    for (const table of ["questoes", "user_question_attempts"])
      expect(requests.filter(request => request.table === table).map(request => request.from)).toEqual([0, 500, 1000, 1205]);
    expect(writes).toBe(0);
  });
  it("does not truncate when the project's row cap is lower than the requested page", async () => {
    cap = 100;
    const result = await caller().quiz.getMyAttempts({ summary: true });
    expect(result).toHaveLength(1205);
    expect(result[0]).not.toHaveProperty("user_id");
    expect(requests.at(-1)?.from).toBe(1205);
  });
  it("preserves own-user, onlyWrong and summary filters over every page", async () => {
    tables.user_question_attempts.push({ ...tables.user_question_attempts[0], user_id: otherId, is_correct: false });
    const rows = await caller().quiz.getMyAttempts({ onlyWrong: true, summary: true });
    expect(rows).toHaveLength(602);
    expect(rows.every((row: any) => row.is_correct === false)).toBe(true);
    expect(rows[0]).toEqual({ question_id: id(1), is_correct: false, answered_at: tables.user_question_attempts[0].answered_at });
  });
  it("loads error-notebook reviews beyond the cap and keeps the other user's data private", async () => {
    tables.user_error_review_status = tables.questoes.map(row => ({ user_id: userId, question_id: row.id, reviewed: true }));
    tables.user_error_review_status.push({ user_id: otherId, question_id: "private" });
    const result = await caller().quiz.getErrorNotebook();
    expect(result.attempts).toHaveLength(602);
    expect(result.reviewStatuses).toHaveLength(1205);
    expect(JSON.stringify(result)).not.toContain("private");
  });
  it("uses all matching attempts in option totals and VET evolution", async () => {
    tables.user_question_attempts.forEach(row => { row.question_id = id(0); });
    expect(await caller().quiz.getQuestionOptionStats({ questionId: id(0) })).toEqual([
      { selected_option: "a", total: 603 }, { selected_option: "b", total: 602 },
    ]);
    const evolution = await caller().vet.getEvolution({ months: 6 });
    expect(evolution).toHaveLength(1);
    expect(evolution[0]).toMatchObject({ totalAttempts: 1205, avgTimeSeconds: 20 });
    expect(evolution[0].accuracy).toBeCloseTo(603 / 1205 * 100);
  });
  it.each(["admin", "editor"] as const)("loads all reports and references for %s, with bounded IN batches", async role => {
    cap = role === "editor" ? 100 : 1000;
    tables.question_reports = tables.questoes.map(row => ({ id: row.id, question_id: row.id, user_id: row.id, created_at: "2026-10-21" }));
    tables.profiles = tables.questoes.map(row => ({ id: row.id, nome: "Synthetic" }));
    const result = await caller(role).admin.listQuestionReports();
    expect(result.reports).toHaveLength(1205);
    expect(result.questions).toHaveLength(1205);
    expect(result.profiles).toHaveLength(1205);
    expect(requests.filter(row => row.table === "questoes" && row.from === 0)).toHaveLength(7);
  });
  it.each(["student", null] as const)("rejects reports for %s before reading anything", async role => {
    await expect(caller(role).admin.listQuestionReports()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(requests).toHaveLength(0);
  });
  it("rejects unauthenticated history before any query", async () => {
    await expect(caller(null).quiz.getMyAttempts()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(requests).toHaveLength(0);
  });
  it.each([false, true])("rejects a later page with SDK failure (thrown=%s), without partial success or sensitive logs", async thrown => {
    fail = (table, from) => table === "user_question_attempts" && from >= 500
      ? thrown ? Object.assign(new Error("secret-token private@example.test"), { code: "network_error" }) : { code: "database_unavailable", message: "secret-token private@example.test" }
      : null;
    await expect(caller().quiz.getMyAttempts()).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toMatch(/secret-token|private@example/);
  });
  it("keeps the historical VET column fallback, with complete pagination", async () => {
    fail = (table, _from, columns) => table === "user_question_attempts" && columns.includes("conteudos") ? { code: "42703" } : null;
    expect(await getCanonicalVetAnalysis(userId)).toMatchObject({ totalAttempts: 1205 });
    expect(requests.filter(row => row.table === "user_question_attempts" && !row.columns.includes("conteudos")).at(-1)?.from).toBe(1205);
  });
  it("does not treat a temporary VET failure as missing optional schema", async () => {
    fail = table => table === "vet_exam_content_weights" ? { code: "connection_error" } : null;
    await expect(getCanonicalVetAnalysis(userId)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it.each(["vet_exam_content_weights", "vet_content_collective_stats"])("keeps the optional-schema fallback for %s", async missingTable => {
    fail = table => table === missingTable ? { code: "PGRST205" } : null;
    expect(await getCanonicalVetAnalysis(userId)).toMatchObject({ totalAttempts: 1205, collectiveDataAvailable: false });
  });
  it("loads weights and collective groups beyond the cap before applying them", async () => {
    seed(3);
    tables.user_vet_profiles[0].focus_subject = "Física";
    tables.vet_exam_content_weights = Array.from({ length: 1201 }, (_, n) => ({ id: id(n), exam: "ITA", subject: n === 1200 ? "Física" : "Matemática", conteudo: n === 1200 ? "Dinâmica" : `Unused ${n}`, weight: 8 }));
    tables.vet_content_collective_stats = tables.vet_exam_content_weights.map((row, n) => ({ ...row, subject: n === 1200 ? "Física" : "Biologia", total_attempts: 100, total_users: 10, correct_attempts: 30, wrong_attempts: 70, collective_accuracy: 30, avg_time_seconds: 40 }));
    const result = await getCanonicalVetAnalysis(userId);
    expect(result?.strategicContents[0]).toMatchObject({ weight: 8, hasAdministrativeWeight: true, collective: { collective_accuracy: 30 } });
    expect(result?.collectiveDataAvailable).toBe(true);
  });
  it("does not reinterpret an unreadable recommendation history as never attempted", async () => {
    const analysis = await getCanonicalVetAnalysis(userId);
    const block = analysis!.strategicContents[0].block;
    fail = (table, _from, columns) => table === "user_question_attempts" && columns === "question_id,answered_at" ? { code: "connection_error" } : null;
    await expect(caller().vet.getRecommendedQuestions({ block, limit: 12 })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("checks the complete mock history before inserting a new session", async () => {
    fail = (table, _from, columns) => table === "user_question_attempts" && columns === "question_id" ? { code: "connection_error" } : null;
    await expect(caller().vet.createMockSession({ mode: "misto" })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(writes).toBe(0);
  });
  it("multiple pending payments do not break canonical access, which can still deny", async () => {
    tables.billing_payments = [1, 2].map(n => ({ id: id(n), user_id: userId, gateway: "mercadopago", status: "pending" }));
    expect(await caller().quiz.getQuestionOptionStats({ questionId: id(0) })).toEqual([{ selected_option: "a", total: 1 }]);
    db.rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(caller().quiz.getQuestionOptionStats({ questionId: id(0) })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("bounds a hung read, aborts it, and never returns incomplete statistics", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const pending = readAllDatabaseRows(() => ({
      abortSignal(value) { signal = value; return new Promise(() => {}); },
      then() { return new Promise(() => {}); },
    }) as any, "synthetic_read");
    const assertion = expect(pending).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", databaseCode: "operation_timeout" });
    await vi.advanceTimersByTimeAsync(8001);
    await assertion;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
