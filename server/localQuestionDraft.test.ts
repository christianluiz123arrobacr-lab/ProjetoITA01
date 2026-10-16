import { describe, it, expect, vi } from "vitest";
import {
  createLocalQuestionPersistence,
  emptyQuestionDocument,
  indexedQuestionDraftStore,
  questionDraftKey,
  oldQuestionDraftKey,
  type QuestionDraftStore,
  type LocalQuestionDraft,
} from "../client/src/lib/localQuestionDraft";
const documentWith = (label: string) => {
  const document = emptyQuestionDocument();
  document.pages[0].strokes = [
    {
      id: label,
      tool: "pen",
      color: "#000000",
      size: 4,
      points: [{ x: 10, y: 20, pressure: 0.8, width: 4 }],
    },
  ];
  return document;
};
function setup() {
  const rows = new Map<string, LocalQuestionDraft>(),
    old = new Map<string, string>();
  const store: QuestionDraftStore = {
    read: vi.fn(async key => rows.get(key)),
    write: vi.fn(async (record, absent) => {
      if (!absent || !rows.has(record.key))
        rows.set(record.key, structuredClone(record));
      return structuredClone(rows.get(record.key)!);
    }),
  };
  const legacyStorage = {
    getItem: vi.fn((key: string) => old.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      old.delete(key);
    }),
  };
  const readRemote = vi.fn(async () => null as any);
  const make = (userId = "A", questionId = "q1", notice = vi.fn()) =>
    createLocalQuestionPersistence({
      userId,
      questionId,
      store,
      legacyStorage,
      readRemote,
      onLegacyError: notice,
    });
  return { rows, old, store, legacyStorage, readRemote, make };
}
describe("rascunhos locais por conta/questão (armazenamento e rede simulados)", () => {
  it("uma linha local inconsistente não expõe o documento de outra conta", async () => {
    const s = setup();
    s.rows.set(questionDraftKey("A", "q1"), {
      key: questionDraftKey("A", "q1"),
      userId: "B",
      questionId: "q1",
      document: documentWith("privado"),
      updatedAt: "",
    });
    await expect(s.make().load()).rejects.toThrow("não pertence");
    expect(s.readRemote).not.toHaveBeenCalled();
  });
  it("falha de commit da importação antiga permite repetir e não apaga o backup", async () => {
    const s = setup();
    s.old.set(
      oldQuestionDraftKey("A", "q1"),
      JSON.stringify(documentWith("backup"))
    );
    vi.mocked(s.store.write).mockRejectedValueOnce(new Error("quota"));
    await expect(s.make().load()).rejects.toThrow("quota");
    expect(s.old.size).toBe(1);
    expect(s.rows.size).toBe(0);
    expect(await s.make().load()).toEqual(documentWith("backup"));
  });
  it("backup inválido fica preservado e não é substituído por consulta remota", async () => {
    const s = setup();
    s.old.set(oldQuestionDraftKey("A", "q1"), "not json");
    await expect(s.make().load()).rejects.toThrow("preservado");
    expect(s.rows.size).toBe(0);
    expect(s.readRemote).not.toHaveBeenCalled();
  });
  it("salva e recupera na remontagem pelo adaptador local sem consultar a nuvem", async () => {
    const s = setup();
    await s.make().save(documentWith("A"));
    expect(await s.make().load()).toEqual(documentWith("A"));
    expect(s.readRemote).not.toHaveBeenCalled();
    expect(s.make().destination).toBe("browser");
  });
  it("isola contas e questões, inclusive ao excluir", async () => {
    const s = setup();
    await s.make("A", "q1").save(documentWith("A1"));
    await s.make("B", "q1").save(documentWith("B1"));
    await s.make("A", "q2").save(documentWith("A2"));
    await s.make("B", "q1").remove();
    expect(await s.make("A", "q1").load()).toEqual(documentWith("A1"));
    expect(await s.make("A", "q2").load()).toEqual(documentWith("A2"));
    expect((await s.make("B", "q1").load()).pages[0].strokes).toEqual([]);
  });
  it("migra localStorage sem apagar o backup nem consultar a nuvem", async () => {
    const s = setup();
    s.old.set(
      oldQuestionDraftKey("A", "q1"),
      JSON.stringify({ ...documentWith("antigo"), updatedAt: "2020-01-01" })
    );
    expect(await s.make().load()).toEqual(documentWith("antigo"));
    expect(s.old.size).toBe(1);
    expect(s.readRemote).not.toHaveBeenCalled();
  });
  it("importa nota antiga somente uma vez após commit bem-sucedido", async () => {
    const s = setup();
    s.readRemote.mockResolvedValue({
      user_id: "A",
      question_id: "q1",
      strokes: [
        {
          id: "__scratchpad_pages_v1",
          tool: "meta",
          payload: { kind: "scratchpad-pages-v1", ...documentWith("remoto") },
        },
      ],
    });
    expect(await s.make().load()).toEqual(documentWith("remoto"));
    await s.make().load();
    expect(s.readRemote).toHaveBeenCalledTimes(1);
  });
  it("ausência remota confirmada também é lembrada", async () => {
    const s = setup();
    await s.make().load();
    await s.make().load();
    expect(s.readRemote).toHaveBeenCalledTimes(1);
  });
  it("falha de rede não marca importação como concluída e permite retry", async () => {
    const s = setup(),
      notice = vi.fn();
    s.readRemote.mockRejectedValueOnce(new Error("network"));
    await s.make("A", "q1", notice).load();
    expect(s.rows.size).toBe(0);
    expect(notice).toHaveBeenCalledTimes(1);
    await s.make().load();
    expect(s.readRemote).toHaveBeenCalledTimes(2);
  });
  it("não aceita nota de outra conta ou questão", async () => {
    const s = setup();
    s.readRemote.mockResolvedValue({
      user_id: "B",
      question_id: "q1",
      strokes: [],
    });
    await s.make().load();
    expect(s.rows.size).toBe(0);
  });
  it("uma resposta remota atrasada não sobrescreve gravação local", async () => {
    const s = setup();
    let finish!: (value: any) => void;
    s.readRemote.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    const reading = s.make().load();
    await vi.waitFor(() => expect(s.readRemote).toHaveBeenCalled());
    await s.make().save(documentWith("novo"));
    finish(null);
    expect(await reading).toEqual(documentWith("novo"));
  });
  it("erro de quota é rejeitado e mantém a versão anterior", async () => {
    const s = setup();
    await s.make().save(documentWith("anterior"));
    vi.mocked(s.store.write).mockRejectedValueOnce(new Error("quota"));
    await expect(s.make().save(documentWith("novo"))).rejects.toThrow("quota");
    expect(await s.make().load()).toEqual(documentWith("anterior"));
  });
  it("exclusão não permite que cleanup atrasado ressuscite a escrita nem reimporte a nuvem", async () => {
    const s = setup(),
      p = s.make();
    await p.save(documentWith("apagar"));
    await p.remove();
    await p.save(documentWith("cleanup velho"));
    expect((await s.make().load()).pages[0].strokes).toEqual([]);
    expect(s.readRemote).not.toHaveBeenCalled();
    expect(s.legacyStorage.removeItem).toHaveBeenCalledWith(
      oldQuestionDraftKey("A", "q1")
    );
  });
  it("limita documentos a 8 MiB antes da transação IndexedDB", async () => {
    const document = documentWith("grande");
    document.pages[0].strokes[0].imageData = "x".repeat(8 * 1024 * 1024);
    await expect(
      indexedQuestionDraftStore.write({
        key: questionDraftKey("A", "q1"),
        userId: "A",
        questionId: "q1",
        document,
        updatedAt: "",
      })
    ).rejects.toThrow("8 MiB");
  });
});
