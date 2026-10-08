import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, TrpcContext } from "./_core/context";

const service = vi.hoisted(() => ({
  createQuestionImportDraft: vi.fn(async () => ({ id: "draft" })),
  listQuestionImportDrafts: vi.fn(async () => []),
  getQuestionImportDraft: vi.fn(async () => ({ id: "draft" })),
  prepareQuestionImportSlotUpload: vi.fn(async () => ({ token: "local-test" })),
  confirmQuestionImportSlotUpload: vi.fn(async () => ({})),
  removeQuestionImportSlotUpload: vi.fn(async () => ({})),
  updateQuestionImportSlotMetadata: vi.fn(async () => ({})),
  cancelQuestionImportDraft: vi.fn(async () => ({})),
  removeInvalidQuestionFromImportDraft: vi.fn(async () => ({})),
  cleanupExpiredQuestionImportDrafts: vi.fn(async () => ({})),
  prepareQuestionImportFinalization: vi.fn(async () => ({ batch: { status: "completed", result: { createdCount: 1 } } })),
  cleanupSkippedQuestionImportImages: vi.fn(),
  completeQuestionImportDraft: vi.fn(),
}));
vi.mock("./questions/questionImportBatchService", () => service);
import { appRouter } from "./routers";

const userId = "00000000-0000-4000-8000-000000000001";
const batchId = "00000000-0000-4000-8000-000000000002";
const slot = { batchId, importKey: "q1", slotId: "fig1" };
function caller(role: AuthUser["role"] | null) {
  return appRouter.createCaller({
    user: role ? { id: userId, role, email: null } : null,
    req: { headers: {} }, res: {},
  } as TrpcContext).admin;
}
const operations = [
  ["createQuestionImportDraft", { rawJson: "{}" }, "createQuestionImportDraft"],
  ["listQuestionImportDrafts", undefined, "listQuestionImportDrafts"],
  ["getQuestionImportDraft", { batchId }, "getQuestionImportDraft"],
  ["prepareQuestionImportImageUpload", { ...slot, originalName: "fig.png", contentType: "image/png", byteSize: 24 }, "prepareQuestionImportSlotUpload"],
  ["confirmQuestionImportImageUpload", { ...slot, altText: "Figura" }, "confirmQuestionImportSlotUpload"],
  ["removeQuestionImportImageUpload", slot, "removeQuestionImportSlotUpload"],
  ["updateQuestionImportImageMetadata", { ...slot, altText: "Figura" }, "updateQuestionImportSlotMetadata"],
  ["cancelQuestionImportDraft", { batchId }, "cancelQuestionImportDraft"],
  ["removeInvalidQuestionFromImportDraft", { batchId, questionIndex: 0 }, "removeInvalidQuestionFromImportDraft"],
  ["cleanupExpiredQuestionImportDrafts", undefined, "cleanupExpiredQuestionImportDrafts"],
  ["finalizeQuestionImportDraft", { batchId }, "prepareQuestionImportFinalization"],
] as const;

afterEach(() => vi.clearAllMocks());

describe("permissões do fluxo de importação em lote", () => {
  it.each(["admin", "editor"] as const)("%s pode usar rascunhos, imagens e finalização com seu próprio ID", async role => {
    const admin = caller(role);
    for (const [endpoint, input, handler] of operations) {
      await (admin[endpoint] as (input: unknown) => Promise<unknown>)(input);
      const args = (service[handler] as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
      expect(args).toContain(userId);
    }
  });
  it.each(["student", null] as const)("bloqueia %s antes de chamar os serviços ou acessar dados", async role => {
    const admin = caller(role);
    for (const [endpoint, input, handler] of operations) {
      await expect((admin[endpoint] as (input: unknown) => Promise<unknown>)(input)).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(service[handler]).not.toHaveBeenCalled();
    }
    await expect(admin.importQuestionBatch({} as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("editor passa pela autorização da importação antiga e continua sujeito à validação do JSON", async () => {
    await expect(caller("editor").importQuestionBatch({} as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("editor continua bloqueado nas operações administrativas fora da importação", async () => {
    const admin = caller("editor");
    await expect(admin.updateStudentProfile({} as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.renewBillingSubscription({} as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.grantAdminAccess({} as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
