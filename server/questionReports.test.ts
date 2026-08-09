import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createQuestionReport, getQuestionReportErrorMessage } from "./questionReports";

describe("question reports", () => {
  it("insere um report pendente pertencente ao usuário autenticado", async () => {
    const insert = vi.fn().mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222", error: null });
    const result = await createQuestionReport({
      questionId: "11111111-1111-4111-8111-111111111111",
      userId: "33333333-3333-4333-8333-333333333333",
      reportType: "gabarito",
      comment: "  A alternativa correta deveria ser B.  ",
    }, { insert });

    expect(result.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      status: "pendente",
      report_type: "gabarito",
      comment: "A alternativa correta deveria ser B.",
    }));
  });

  it("explica quando a tabela ainda não foi criada", async () => {
    const insert = vi.fn().mockResolvedValue({ id: null, error: { code: "PGRST205", message: "table missing" } });
    await expect(createQuestionReport({
      questionId: "11111111-1111-4111-8111-111111111111",
      userId: "33333333-3333-4333-8333-333333333333",
      reportType: "outro",
    }, { insert })).rejects.toThrow("migration de question_reports");
  });

  it("não expõe mensagens internas inesperadas do banco", () => {
    expect(getQuestionReportErrorMessage({ code: "XX000", message: "secret internal detail" }))
      .toBe("Não foi possível enviar o report agora. Tente novamente em instantes.");
  });

  it("possui migration completa com tabela, índices e RLS", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202607290001_create_question_reports.sql", import.meta.url), "utf8");
    expect(sql).toContain("create table if not exists public.question_reports");
    expect(sql).toContain("references public.questoes(id)");
    expect(sql).toContain("alter table public.question_reports enable row level security");
    expect(sql).toContain('create policy "question_reports_insert_own_pending"');
    expect(sql).toContain("question_reports_status_created_idx");
  });
});
