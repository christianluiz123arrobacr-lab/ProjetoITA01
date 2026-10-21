import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, TrpcContext } from "./_core/context";

const service = vi.hoisted(() => ({
  createQuestionImportDraft: vi.fn(async () => ({ id: "draft" })),
  listQuestionImportDrafts: vi.fn(async () => []),
  getQuestionImportDraft: vi.fn(async () => ({ id: "draft" })),
  prepareQuestionImportSlotUpload: vi.fn(async () => ({ token: "local-test" })),
  confirmQuestionImportSlotUpload: vi.fn(async () => ({})),
  discardQuestionImportReplacement: vi.fn(async () => ({ removed: true })),
  removeQuestionImportSlotUpload: vi.fn(async () => ({})),
  updateQuestionImportSlotMetadata: vi.fn(async () => ({})),
  cancelQuestionImportDraft: vi.fn(async () => ({})),
  removeInvalidQuestionFromImportDraft: vi.fn(async () => ({})),
  cleanupExpiredQuestionImportDrafts: vi.fn(async () => ({})),
  finalizeQuestionImportDraft: vi.fn(async () => ({ createdCount: 1 })),
  importLegacyQuestionBatch: vi.fn(),
  cleanupQuestionImportDraft: vi.fn(async () => ({})),
}));
vi.mock("./questions/questionImportBatchService", () => service);
import { appRouter } from "./routers";
import { parseQuestionImportPayload } from "../shared/questionImportSchema";

const userId = "00000000-0000-4000-8000-000000000001";
const batchId = "00000000-0000-4000-8000-000000000002";
const slot = { batchId, importKey: "q1", slotId: "fig1" };
function caller(role: AuthUser["role"] | null) {
  return appRouter.createCaller({
    user: role ? { id: userId, role, email: null } : null,
    req: { headers: {} },
    res: {},
  } as TrpcContext).admin;
}
const operations = [
  ["createQuestionImportDraft", { rawJson: "{}" }, "createQuestionImportDraft"],
  ["listQuestionImportDrafts", undefined, "listQuestionImportDrafts"],
  ["getQuestionImportDraft", { batchId }, "getQuestionImportDraft"],
  [
    "prepareQuestionImportImageUpload",
    {
      ...slot,
      originalName: "fig.png",
      contentType: "image/png",
      byteSize: 24,
    },
    "prepareQuestionImportSlotUpload",
  ],
  [
    "confirmQuestionImportImageUpload",
    { ...slot, altText: "Figura" },
    "confirmQuestionImportSlotUpload",
  ],
  [
    "discardQuestionImportImageReplacement",
    { ...slot, uploadPath: "question-imports/x/y.png" },
    "discardQuestionImportReplacement",
  ],
  ["removeQuestionImportImageUpload", slot, "removeQuestionImportSlotUpload"],
  [
    "updateQuestionImportImageMetadata",
    { ...slot, altText: "Figura" },
    "updateQuestionImportSlotMetadata",
  ],
  ["cancelQuestionImportDraft", { batchId }, "cancelQuestionImportDraft"],
  [
    "removeInvalidQuestionFromImportDraft",
    { batchId, questionIndex: 0 },
    "removeInvalidQuestionFromImportDraft",
  ],
  [
    "cleanupExpiredQuestionImportDrafts",
    undefined,
    "cleanupExpiredQuestionImportDrafts",
  ],
  [
    "finalizeQuestionImportDraft",
    { batchId, protocolVersion: 2 },
    "finalizeQuestionImportDraft",
  ],
  ["cleanupQuestionImportDraft", { batchId }, "cleanupQuestionImportDraft"],
] as const;

afterEach(() => vi.clearAllMocks());

describe("permissões do fluxo de importação em lote", () => {
  it("rota legada exige protocolo de progresso e preserva finalizing para cliente atualizado", async () => {
    const q = parseQuestionImportPayload({
      disciplina: "Física",
      conteudo: "Mecânica",
      assunto: "Cinemática",
      dificuldade: "medio",
      enunciado: "Teste",
      alternativas: [
        { letra: "A", texto: "a" },
        { letra: "B", texto: "b" },
        { letra: "C", texto: "c" },
      ],
      resposta: "A",
      resolucao: "Explicação",
    }).questoes[0].item;
    const input = { batchId: "legacy-request", questions: [q] };
    await expect(
      caller("editor").importQuestionBatch(input)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(service.importLegacyQuestionBatch).not.toHaveBeenCalled();
    service.importLegacyQuestionBatch.mockResolvedValueOnce({
      status: "finalizing",
      pendingCount: 2,
    });
    expect(
      await caller("editor").importQuestionBatch({
        ...input,
        protocolVersion: 2,
      })
    ).toMatchObject({ status: "finalizing", pendingCount: 2 });
  });
  it("aba antiga é bloqueada antes de iniciar uma finalização parcial", async () => {
    await expect(
      caller("editor").finalizeQuestionImportDraft({ batchId })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(service.finalizeQuestionImportDraft).not.toHaveBeenCalled();
  });
  it("retry explícito da finalização concluída retorna o mesmo resultado sem criar questões outra vez", async () => {
    const admin = caller("editor");
    expect(
      await admin.finalizeQuestionImportDraft({ batchId, protocolVersion: 2 })
    ).toEqual({ createdCount: 1 });
    expect(
      await admin.finalizeQuestionImportDraft({ batchId, protocolVersion: 2 })
    ).toEqual({ createdCount: 1 });
    expect(service.finalizeQuestionImportDraft).toHaveBeenCalledTimes(2);
  });
  it.each(["admin", "editor"] as const)(
    "%s pode usar rascunhos, imagens e finalização com seu próprio ID",
    async role => {
      const admin = caller(role);
      for (const [endpoint, input, handler] of operations) {
        await (admin[endpoint] as (input: unknown) => Promise<unknown>)(input);
        const args = (
          service[handler] as ReturnType<typeof vi.fn>
        ).mock.calls.at(-1)!;
        expect(args).toContain(userId);
      }
    }
  );
  it.each(["student", null] as const)(
    "bloqueia %s antes de chamar os serviços ou acessar dados",
    async role => {
      const admin = caller(role);
      for (const [endpoint, input, handler] of operations) {
        await expect(
          (admin[endpoint] as (input: unknown) => Promise<unknown>)(input)
        ).rejects.toMatchObject({ code: "FORBIDDEN" });
        expect(service[handler]).not.toHaveBeenCalled();
      }
      await expect(
        admin.importQuestionBatch({} as never)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        admin.discardAdminPreparedImage({
          path: "statement-images/other/file.png",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  );
  it("editor passa pela autorização da importação antiga e continua sujeito à validação do JSON", async () => {
    await expect(
      caller("editor").importQuestionBatch({} as never)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("editor continua bloqueado nas operações administrativas fora da importação", async () => {
    const admin = caller("editor");
    await expect(admin.updateStudentProfile({} as never)).rejects.toMatchObject(
      { code: "FORBIDDEN" }
    );
    await expect(
      admin.renewBillingSubscription({} as never)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.grantAdminAccess({} as never)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
