import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  batches: [] as any[],
  slots: [] as any[],
  files: new Map<string, Blob>(),
  removed: [] as string[],
  events: [] as string[],
  failUpdate: false,
  conflict: false,
}));
class Query {
  filters: Array<(row: any) => boolean> = [];
  patch: any;
  constructor(private table: string) {}
  select() {
    return this;
  }
  eq(k: string, v: any) {
    this.filters.push(row => row[k] === v);
    return this;
  }
  is(k: string, v: any) {
    return this.eq(k, v);
  }
  order() {
    return this;
  }
  update(p: any) {
    this.patch = p;
    return this;
  }
  async execute(single = false) {
    if (this.patch && state.failUpdate)
      return { data: null, error: { code: "08006" } };
    if (this.patch && state.conflict) {
      state.slots[0].storage_path = "concurrent.png";
      state.conflict = false;
    }
    const rows = (
      this.table === "question_import_batches" ? state.batches : state.slots
    ).filter(row => this.filters.every(test => test(row)));
    if (this.patch) {
      rows.forEach(row => Object.assign(row, this.patch));
      state.events.push("commit");
    }
    return {
      data: single
        ? rows[0]
          ? { ...rows[0] }
          : null
        : rows.map(row => ({ ...row })),
      error: null,
    };
  }
  maybeSingle() {
    return this.execute(true);
  }
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}
vi.mock("./_core/supabaseAdmin.js", () => ({
  supabaseAdmin: {
    from: (table: string) => new Query(table),
    storage: {
      from: () => ({
        createSignedUploadUrl: async (path: string) => ({
          data: {
            token: "synthetic",
            signedUrl: `https://local.invalid/${path}`,
          },
          error: null,
        }),
        download: async (path: string) => ({
          data: state.files.get(path) ?? null,
          error: state.files.has(path) ? null : { code: "404" },
        }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://local.invalid/${path}` },
        }),
        remove: async (paths: string[]) => {
          for (const p of paths) {
            if (p === "old.png" && state.slots[0]?.storage_path === p)
              throw new Error("Deleted previous reference before commit");
            state.events.push(`remove:${p}`);
            state.removed.push(p);
            state.files.delete(p);
          }
          return { error: null };
        },
      }),
    },
  },
}));
import {
  prepareQuestionImportSlotUpload,
  confirmQuestionImportSlotUpload,
  discardQuestionImportReplacement,
} from "./questions/questionImportBatchService";
const user = "00000000-0000-4000-8000-000000000001",
  batchId = "00000000-0000-4000-8000-000000000002",
  slotId = "figura";
const identity = { batchId, slotId, importKey: "original.png" };
function png() {
  const b = new Uint8Array(30);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(b.buffer).setUint32(16, 10);
  new DataView(b.buffer).setUint32(20, 20);
  return new Blob([b], { type: "image/png" });
}
beforeEach(() => {
  state.batches = [
    { id: batchId, created_by: user, status: "draft", payload: {} },
  ];
  state.slots = [
    {
      id: "00000000-0000-4000-8000-000000000003",
      batch_id: batchId,
      slot_id: slotId,
      import_key: "original.png",
      location: "enunciado",
      required: true,
      status: "ready",
      storage_path: "old.png",
      bucket: "questoes-imagens",
      public_url: "https://local.invalid/old.png",
    },
  ];
  state.files.clear();
  state.files.set("old.png", png());
  state.removed = [];
  state.events = [];
  state.failUpdate = false;
  state.conflict = false;
});
async function prepare() {
  return prepareQuestionImportSlotUpload(
    {
      ...identity,
      originalName: "prepared.png",
      contentType: "image/png",
      byteSize: 30,
    },
    user
  );
}
async function confirm(ticket: Awaited<ReturnType<typeof prepare>>) {
  return confirmQuestionImportSlotUpload(
    {
      ...identity,
      uploadPath: ticket.path,
      previousPath: ticket.previousPath,
      contentType: "image/png",
      originalName: "prepared.png",
      altText: "Diagrama",
    },
    user
  );
}
describe("substituição em lote: Storage e banco simulados, sem acesso remoto", () => {
  it("URL assinada não remove nem invalida o arquivo anterior", async () => {
    await prepare();
    expect(state.slots[0].storage_path).toBe("old.png");
    expect(state.slots[0].status).toBe("ready");
    expect(state.removed).toEqual([]);
  });
  it("grava referência verificada antes de limpar antiga; retry confirma sem duplicar ou apagar a nova", async () => {
    const t = await prepare();
    state.files.set(t.path, png());
    await confirm(t);
    expect(state.slots[0].storage_path).toBe(t.path);
    expect(state.events.indexOf("commit")).toBeLessThan(
      state.events.indexOf("remove:old.png")
    );
    const removed = [...state.removed];
    await confirm(t);
    expect(state.removed).toEqual(removed);
    expect(
      (
        await discardQuestionImportReplacement(
          { ...identity, uploadPath: t.path },
          user
        )
      ).removed
    ).toBe(false);
  });
  it.each(["missing", "invalid", "database"])(
    "falha %s preserva a imagem antiga",
    async kind => {
      const t = await prepare();
      if (kind !== "missing")
        state.files.set(
          t.path,
          kind === "invalid" ? new Blob(["not png"]) : png()
        );
      if (kind === "database") state.failUpdate = true;
      await expect(confirm(t)).rejects.toBeDefined();
      expect(state.slots[0].storage_path).toBe("old.png");
      expect(state.files.has("old.png")).toBe(true);
      expect(state.removed).not.toContain("old.png");
    }
  );
  it("cancelamento limpa somente candidata não associada", async () => {
    const t = await prepare();
    state.files.set(t.path, png());
    await discardQuestionImportReplacement(
      { ...identity, uploadPath: t.path },
      user
    );
    expect(state.files.has("old.png")).toBe(true);
    expect(state.files.has(t.path)).toBe(false);
  });
  it("retry de falha temporária na confirmação reutiliza a candidata já enviada", async () => {
    const t = await prepare();
    state.files.set(t.path, png());
    state.failUpdate = true;
    await expect(confirm(t)).rejects.toBeDefined();
    expect(state.files.has(t.path)).toBe(true);
    state.failUpdate = false;
    await confirm(t);
    expect(state.slots[0].storage_path).toBe(t.path);
  });
  it("rejeita usuário diferente, arquivo de outro slot e troca concorrente", async () => {
    await expect(
      prepareQuestionImportSlotUpload(
        {
          ...identity,
          originalName: "x.png",
          contentType: "image/png",
          byteSize: 30,
        },
        "outro"
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const t = await prepare();
    await expect(
      confirmQuestionImportSlotUpload(
        {
          ...identity,
          uploadPath: t.path.replace(state.slots[0].id, user),
          altText: "D",
        },
        user
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    state.files.set(t.path, png());
    state.conflict = true;
    await expect(confirm(t)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(state.removed).not.toContain("old.png");
    expect(state.slots[0].storage_path).toBe("concurrent.png");
  });
});
