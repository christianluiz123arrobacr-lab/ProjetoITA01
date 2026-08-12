import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/202608080001_fix_attempt_question_id_uuid.sql", import.meta.url),
  "utf8"
);
const canonicalAttempt = readFileSync(
  new URL("../supabase/migrations/202608020003_fix_uppercase_question_options.sql", import.meta.url),
  "utf8"
);
const client = readFileSync(
  new URL("../client/src/components/InteractiveQuiz.tsx", import.meta.url),
  "utf8"
);
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("UUID canônico das tentativas", () => {
  it("valida dados antes de converter question_id de text para uuid", () => {
    expect(migration).toContain("lock table public.user_question_attempts in access exclusive mode");
    expect(migration).toContain("contains a non-UUID value");
    expect(migration).toContain("alter column question_id type uuid");
    expect(migration).toContain("using question_id::uuid");
  });

  it("é idempotente e recria o índice de consulta por questão", () => {
    expect(migration).toContain("if current_data_type = 'uuid'");
    expect(migration).toContain("create index if not exists idx_user_question_attempts_question_id");
  });

  it("mantém comparações UUID com UUID sem casts textuais frágeis", () => {
    expect(canonicalAttempt).toContain("v_question from public.questoes where id = p_question_id");
    expect(canonicalAttempt).toContain("a.user_id = p_user_id and a.question_id = p_question_id");
    expect(canonicalAttempt).toContain("r.questao_id = p_question_id");
    expect(canonicalAttempt).not.toMatch(/question_id::text\s*=|=\s*p_question_id::text/);
  });

  it("não aceita isCorrect calculado pelo frontend", () => {
    expect(client).not.toMatch(/mutateAsync\(\{[\s\S]{0,400}isCorrect/);
    expect(canonicalAttempt).toContain(
      "v_correct := lower(trim(p_selected_option)) = lower(trim(v_question.alternativa_correta))"
    );
  });

  it("mantém validação oficial, rejeição de questão inexistente e incremento de tentativas", () => {
    expect(canonicalAttempt).toContain("question not found or unpublished");
    expect(canonicalAttempt).toContain("coalesce(max(a.attempt_number), 0) + 1");
    expect(canonicalAttempt).toContain("insert into public.user_question_attempts");
    expect(canonicalAttempt).toContain("returning id into v_attempt_id");
  });

  it("consulta estatísticas pela questão UUID e agrega as alternativas registradas", () => {
    const start = router.indexOf("getQuestionOptionStats: protectedProcedure");
    const end = router.indexOf("recordAttempt: protectedProcedure", start);
    const statsProcedure = router.slice(start, end);

    expect(statsProcedure).toContain('.eq("question_id", input.questionId)');
    expect(statsProcedure).toContain("counts.set(option, (counts.get(option) ?? 0) + 1)");
    expect(statsProcedure).toContain("Array.from(counts.entries())");
  });
});
