import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { createImportDatabase } from "./testing/questionImportDatabase";

const state = vi.hoisted(() => ({
  db: null as PGlite | null,
  files: new Map<string, Blob>(),
  removed: [] as string[],
  storageError: false,
  failItem: 0,
  itemCalls: 0,
  lostResponse: false,
  lostComplete: false,
}));
class Query {
  filters: string[] = [];
  params: unknown[] = [];
  sorting = "";
  bound = "";
  one = false;
  constructor(readonly table: string) {}
  select(_fields?: string) {
    return this;
  }
  eq(k: string, v: unknown) {
    this.params.push(v);
    this.filters.push(`"${k}"=$${this.params.length}`);
    return this;
  }
  in(k: string, v: unknown[]) {
    this.params.push(v);
    this.filters.push(`"${k}"=any($${this.params.length})`);
    return this;
  }
  lt(k: string, v: unknown) {
    this.params.push(v);
    this.filters.push(`"${k}"<$${this.params.length}`);
    return this;
  }
  order(k: string, opts?: { ascending?: boolean }) {
    this.sorting = ` order by "${k}" ${opts?.ascending === false ? "desc" : "asc"}`;
    return this;
  }
  limit(n: number) {
    this.bound = ` limit ${n}`;
    return this;
  }
  maybeSingle() {
    this.one = true;
    return this;
  }
  abortSignal() {
    return this;
  }
  async execute() {
    try {
      const result = await state.db!.query(
        `select * from public.${this.table}${this.filters.length ? ` where ${this.filters.join(" and ")}` : ""}${this.sorting}${this.bound}`,
        this.params
      );
      return {
        data: this.one ? (result.rows[0] ?? null) : result.rows,
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  }
  then(resolve: any, reject: any) {
    return this.execute().then(resolve, reject);
  }
}
vi.mock("./_core/supabaseAdmin.js", () => ({
  supabaseAdmin: {
    from: (table: string) => new Query(table),
    rpc: (name: string, args: any) => ({
      abortSignal: async () => {
        try {
          if (
            name === "vet_import_commit_item" &&
            ++state.itemCalls === state.failItem
          )
            throw { code: "08006" };
          const values =
            name === "vet_import_control"
              ? [
                  args.p_batch,
                  args.p_actor,
                  args.p_action,
                  args.p_token,
                  args.p_args,
                ]
              : [
                  args.p_batch,
                  args.p_actor,
                  args.p_token,
                  args.p_key,
                  args.p_question,
                  args.p_blocks,
                  args.p_index,
                ];
          const result = await state.db!.query<{ result: unknown }>(
            `select public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")}) result`,
            values
          );
          if (name === "vet_import_commit_item" && state.lostResponse) {
            state.lostResponse = false;
            throw { code: "08006" };
          }
          if (
            name === "vet_import_control" &&
            args.p_action === "complete" &&
            state.lostComplete
          ) {
            state.lostComplete = false;
            throw { code: "08006" };
          }
          return { data: result.rows[0].result, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://storage.test/${bucket}/${path}` },
        }),
        createSignedUploadUrl: async (path: string) => ({
          data: { token: "local", signedUrl: `https://storage.test/${path}` },
          error: null,
        }),
        download: async (path: string) => ({
          data: state.files.get(path),
          error: state.files.has(path) ? null : { code: "404" },
        }),
        list: async (
          prefix: string,
          opts: { offset: number; limit: number }
        ) => ({
          data: [...state.files.keys()]
            .filter(p => p.startsWith(prefix + "/"))
            .map(p => ({ name: p.slice(prefix.length + 1) }))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(opts.offset, opts.offset + opts.limit),
          error: null,
        }),
        remove: async (paths: string[]) => {
          if (state.storageError)
            return { error: { code: "storage_unavailable" } };
          const data = paths
            .filter(p => state.files.has(p))
            .map(name => ({ name }));
          paths.forEach(p => {
            state.removed.push(p);
            state.files.delete(p);
          });
          return { data, error: null };
        },
      }),
    },
  },
}));
import {
  cancelQuestionImportDraft,
  cleanupQuestionImportDraft,
  confirmQuestionImportSlotUpload,
  createQuestionImportDraft,
  discardQuestionImportReplacement,
  finalizeQuestionImportDraft,
  getQuestionImportDraft,
  importLegacyQuestionBatch,
  prepareQuestionImportSlotUpload,
  removeQuestionImportSlotUpload,
  updateQuestionImportSlotMetadata,
  cleanupExpiredQuestionImportDrafts,
} from "./questions/questionImportBatchService";
import {
  buildQuestionInsertPayload,
  parseQuestionImportPayload,
} from "../shared/questionImportSchema";
const actor = "10000000-0000-4000-8000-000000000001",
  other = "10000000-0000-4000-8000-000000000002";
let db: PGlite;
const question = (key = "q1", image = false) => ({
  chave_importacao: key,
  disciplina: "Física",
  dificuldade: "medio",
  conteudo: "Mecânica",
  assunto: "Cinemática",
  enunciado: "Questão de teste",
  alternativas: { a: "1", b: "2" },
  resposta: "a",
  resolucao: "Resolução de teste",
  imagens: image
    ? [
        {
          slot_id: "fig",
          local: "enunciado",
          obrigatoria: true,
          texto_alternativo: "Diagrama",
        },
      ]
    : [],
});
const create = (n = 1, image = false) =>
  createQuestionImportDraft(
    actor,
    JSON.stringify({
      formato: "questoes-v2",
      questoes: Array.from({ length: n }, (_, i) => question(`q${i}`, image)),
    })
  );
const sqlControl = async (
  batch: string,
  action: string,
  token: string | null,
  args: any = {},
  user = actor
) =>
  (
    await db.query<{ result: any }>(
      "select vet_import_control($1,$2,$3,$4,$5) result",
      [batch, user, action, token, args]
    )
  ).rows[0].result;
const claim = (batch: string, kind = "finalize", token = randomUUID()) =>
  sqlControl(batch, "claim", token, { kind });
const expire = async (batch: string) =>
  db.transaction(async tx => {
    await tx.query("select set_config('vet.import_batch',$1,true)", [batch]);
    await tx.query(
      "update question_import_batches set lease_until=now()-interval '1 second' where id=$1",
      [batch]
    );
  });
const counts = async () =>
  (
    await db.query<any>(
      "select (select count(*)::int from questoes) questions,(select count(*)::int from resolucoes) blocks,(select count(*)::int from question_import_items) items"
    )
  ).rows[0];
function png() {
  const b = new Uint8Array(30);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  new DataView(b.buffer).setUint32(16, 10);
  new DataView(b.buffer).setUint32(20, 20);
  return new Blob([b], { type: "image/png" });
}
async function upload(draft: any) {
  const identity = {
    batchId: draft.id,
    importKey: draft.slots[0].import_key,
    slotId: "fig",
  };
  const ticket = await prepareQuestionImportSlotUpload(
    {
      ...identity,
      originalName: "fig.png",
      contentType: "image/png",
      byteSize: 30,
    },
    actor
  );
  state.files.set(ticket.path, png());
  const confirm = () =>
    confirmQuestionImportSlotUpload(
      {
        ...identity,
        uploadPath: ticket.path,
        previousPath: ticket.previousPath,
        contentType: "image/png",
        altText: "Diagrama",
      },
      actor
    );
  return { identity, ticket, confirm };
}
beforeAll(async () => {
  db = await createImportDatabase();
  state.db = db;
  await db.query("insert into auth.users values($1),($2)", [actor, other]);
  await db.query("insert into profiles values($1,'editor'),($2,'editor')", [
    actor,
    other,
  ]);
}, 30000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(
    "truncate question_import_batches,question_import_assets,question_import_items,question_import_image_slots,questoes,resolucoes cascade;"
  );
  state.files.clear();
  state.removed = [];
  state.storageError = false;
  state.failItem = 0;
  state.itemCalls = 0;
  state.lostResponse = false;
  state.lostComplete = false;
});

describe("recuperação da importação: efeitos reais em PostgreSQL local descartável", () => {
  it("referência com caminho percent-encoded também retém o objeto físico", async () => {
    const d = await create(1, true),
      u = await upload(d);
    const encoded = u.ticket.path
      .replaceAll("/", "%2F")
      .replaceAll("-", "%2D")
      .replace("question", "%71uestion");
    await db.query("insert into questoes(url_imagem) values($1)", [
      `https://storage.test/${encoded}`,
    ]);
    await cancelQuestionImportDraft(d.id, actor);
    expect(state.removed).not.toContain(u.ticket.path);
  });
  it("upload tardio continua tombstonado e é removido de novo antes de encerrar a janela", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await cancelQuestionImportDraft(d.id, actor);
    expect(
      (
        await db.query<any>(
          "select state from question_import_assets where storage_path=$1",
          [u.ticket.path]
        )
      ).rows[0].state
    ).toBe("delete_pending");
    state.files.set(u.ticket.path, png());
    await expect(u.confirm()).rejects.toBeDefined();
    await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.has(u.ticket.path)).toBe(false);
    expect(
      (
        await db.query<any>(
          "select state from question_import_assets where storage_path=$1",
          [u.ticket.path]
        )
      ).rows[0].state
    ).toBe("delete_pending");
  });
  it("journal suprimido por trigger não confirma questão mesmo sem blocos", async () => {
    const d = await create();
    const c = await claim(d.id);
    await sqlControl(d.id, "start", c.operation_id);
    await db.exec(
      "create function suppress_journal() returns trigger language plpgsql as $$begin return null;end$$;create trigger suppress_journal before insert on question_import_items for each row execute function suppress_journal();"
    );
    try {
      const q = d.payload.questions[0];
      await expect(
        db.query("select vet_import_commit_item($1,$2,$3,$4,$5,'[]',0)", [
          d.id,
          actor,
          c.operation_id,
          q.chave_importacao,
          buildQuestionInsertPayload(q, d.id, actor),
        ])
      ).rejects.toMatchObject({ code: "55000" });
      expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
    } finally {
      await db.exec(
        "drop trigger suppress_journal on question_import_items;drop function suppress_journal();"
      );
    }
  });
  it("snapshot não expõe a posse e apresenta revisão, slots e journal juntos", async () => {
    const d = await create(2, true);
    const lease = await claim(d.id, "edit");
    const snapshot = await getQuestionImportDraft(d.id, actor);
    expect(snapshot.operation_id).toBeUndefined();
    expect(snapshot.revision).toBe(lease.revision);
    expect(snapshot.slots).toHaveLength(2);
    expect(snapshot.progress).toEqual([]);
  });
  it.each(["enunciado", "A"])(
    "referência Markdown em %s preserva o arquivo na limpeza",
    async field => {
      const d = await create(1, true),
        u = await upload(d);
      await db.query(`insert into questoes("${field}") values($1)`, [
        `Figura: ![diagrama](https://storage.test/questoes-imagens/${u.ticket.path})`,
      ]);
      await cancelQuestionImportDraft(d.id, actor);
      expect(state.removed).not.toContain(u.ticket.path);
      expect(
        (
          await db.query<any>(
            "select state from question_import_assets where storage_path=$1",
            [u.ticket.path]
          )
        ).rows[0].state
      ).toBe("retained");
    }
  );
  it("referência por URL assinada ao mesmo caminho é preservada e tombstone bloqueia esse alias", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await discardQuestionImportReplacement(
      { ...u.identity, uploadPath: u.ticket.path },
      actor
    );
    await expect(
      db.query("insert into questoes(url_imagem) values($1)", [
        `https://storage.test/storage/v1/object/sign/questoes-imagens/${u.ticket.path}?token=synthetic`,
      ])
    ).rejects.toMatchObject({ code: "55000" });
  });
  it("texto de resolução com Markdown retém a imagem, inclusive sem campo url_imagem", async () => {
    const d = await create(1, true),
      u = await upload(d);
    const q = (
      await db.query<any>(
        "insert into questoes(enunciado) values('Manual') returning id"
      )
    ).rows[0];
    await db.query(
      "insert into resolucoes(questao_id,tipo,texto) values($1,'texto',$2)",
      [q.id, `![Figura](https://storage.test/${u.ticket.path})`]
    );
    await cancelQuestionImportDraft(d.id, actor);
    expect(state.removed).not.toContain(u.ticket.path);
  });
  it("cadastro, edição e publicação sem imagem continuam permitidos fora do protocolo de lote", async () => {
    const q = (
      await db.query<any>(
        "insert into questoes(enunciado,publicada) values('Manual',false) returning id"
      )
    ).rows[0];
    await db.query(
      "update questoes set enunciado='Editada',publicada=true where id=$1",
      [q.id]
    );
    await db.query(
      "insert into resolucoes(questao_id,tipo,texto) values($1,'texto','Explicação')",
      [q.id]
    );
    await db.query(
      "update resolucoes set texto='Editada' where questao_id=$1",
      [q.id]
    );
    await db.query("delete from resolucoes where questao_id=$1", [q.id]);
    await db.query("delete from questoes where id=$1", [q.id]);
    expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
  });
  it("falha na discovery mantém pendência mesmo depois de varredura concluída anteriormente", async () => {
    const d = await create(1, true);
    await cancelQuestionImportDraft(d.id, actor);
    const token = randomUUID();
    await claim(d.id, "cleanup", token);
    // Simulate SDK listing failure: no advance_scan, but planner still runs.
    await sqlControl(d.id, "plan_delete", token);
    await sqlControl(d.id, "release", token);
    expect((await getQuestionImportDraft(d.id, actor)).cleanup_pending).toBe(
      true
    );
  });
  it("limpa imagem de questão inválida ignorada sem atingir os itens importados", async () => {
    const invalid = { ...question("invalid", true), enunciado: "" };
    const d = await createQuestionImportDraft(
      actor,
      JSON.stringify({
        formato: "questoes-v2",
        questoes: [question("valid"), invalid],
      })
    );
    const image = await upload(d);
    await image.confirm();
    expect(
      (await finalizeQuestionImportDraft(d.id, actor)).skippedInvalidCount
    ).toBe(1);
    await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.has(image.ticket.path)).toBe(false);
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("limpeza paginada não perde arquivos legados quando exclusões deslocam a listagem", async () => {
    const d = await create(1, true);
    const paths = Array.from(
      { length: 7 },
      () => `question-imports/${d.id}/${d.slots[0].id}/${randomUUID()}.png`
    );
    paths.forEach(path => state.files.set(path, png()));
    await cancelQuestionImportDraft(d.id, actor);
    for (let step = 0; step < 8 && state.files.size; step++)
      await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.size).toBe(0);
    expect(new Set(state.removed).size).toBe(7);
  });
  it("cria questão, blocos e progresso atomicamente e retorna resultado persistido após retry", async () => {
    const d = await create();
    const r = await finalizeQuestionImportDraft(d.id, actor);
    expect(r.status).toBe("completed");
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
    expect(await finalizeQuestionImportDraft(d.id, actor)).toEqual(r);
  });
  it("somente um claim vence entre chamadas simultâneas (PGlite serializa a conexão)", async () => {
    const d = await create();
    const outcomes = await Promise.allSettled([claim(d.id), claim(d.id)]);
    expect(outcomes.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
  });
  it("finalizador com posse impede cancelar, limpar, confirmar, remover ou editar imagem", async () => {
    const d = await create(1, true),
      u = await upload(d);
    const c = await claim(d.id);
    await sqlControl(d.id, "start", c.operation_id);
    for (const action of [
      () => cancelQuestionImportDraft(d.id, actor),
      () => cleanupQuestionImportDraft(d.id, actor),
      u.confirm,
      () =>
        removeQuestionImportSlotUpload(
          d.id,
          u.identity.importKey,
          "fig",
          actor
        ),
      () =>
        updateQuestionImportSlotMetadata(
          { ...u.identity, altText: "Novo" },
          actor
        ),
    ])
      await expect(action()).rejects.toBeDefined();
    expect(state.removed).toEqual([]);
  });
  it("cancelamento vencendo primeiro impede finalização e confirmação", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await cancelQuestionImportDraft(d.id, actor);
    await expect(
      finalizeQuestionImportDraft(d.id, actor)
    ).rejects.toBeDefined();
    await expect(u.confirm()).rejects.toBeDefined();
    expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
  });
  it("bloqueia imagem obrigatória sem congelar o rascunho", async () => {
    const d = await create(1, true);
    await expect(
      finalizeQuestionImportDraft(d.id, actor)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect((await getQuestionImportDraft(d.id, actor)).status).toBe("draft");
  });
  it("falha de bloco reverte a transação inteira, sem DELETE compensatório", async () => {
    const d = await create();
    await db.exec(
      "create function fail_import_block() returns trigger language plpgsql as $$begin raise exception 'injected_failure';end$$;create trigger fail_import_block before insert on resolucoes for each row execute function fail_import_block();"
    );
    try {
      await expect(
        finalizeQuestionImportDraft(d.id, actor)
      ).rejects.toBeDefined();
      expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
    } finally {
      await db.exec(
        "drop trigger fail_import_block on resolucoes;drop function fail_import_block();"
      );
    }
    expect((await finalizeQuestionImportDraft(d.id, actor)).status).toBe(
      "completed"
    );
  });
  it("retoma apenas os itens pendentes após falha e refresh", async () => {
    const d = await create(3);
    expect(
      (await finalizeQuestionImportDraft(d.id, actor)).confirmedCount
    ).toBe(1);
    state.failItem = 2;
    await expect(
      finalizeQuestionImportDraft(d.id, actor)
    ).rejects.toBeDefined();
    expect((await getQuestionImportDraft(d.id, actor)).progress).toHaveLength(
      1
    );
    await expect(cancelQuestionImportDraft(d.id, actor)).rejects.toBeDefined();
    await finalizeQuestionImportDraft(d.id, actor);
    const r = await finalizeQuestionImportDraft(d.id, actor);
    expect(r.status).toBe("completed");
    expect(await counts()).toEqual({ questions: 3, blocks: 3, items: 3 });
  });
  it("resposta perdida após commit reconhece progresso sem duplicação", async () => {
    const d = await create();
    state.lostResponse = true;
    await expect(
      finalizeQuestionImportDraft(d.id, actor)
    ).rejects.toBeDefined();
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
    await finalizeQuestionImportDraft(d.id, actor);
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("lease expirada permite retomada e bloqueia a execução antiga", async () => {
    const d = await create(),
      old = await claim(d.id);
    await sqlControl(d.id, "start", old.operation_id);
    await expire(d.id);
    await claim(d.id);
    const q = d.payload.questions[0];
    await expect(
      db.query("select vet_import_commit_item($1,$2,$3,$4,$5,$6,0)", [
        d.id,
        actor,
        old.operation_id,
        q.chave_importacao,
        buildQuestionInsertPayload(q, d.id, actor),
        q.resolucao_blocos,
      ])
    ).rejects.toMatchObject({ code: "40001" });
    for (const action of ["renew", "release", "complete"])
      await expect(
        sqlControl(d.id, action, old.operation_id, {
          expected_count: 0,
          result: {},
        })
      ).rejects.toMatchObject({ code: "40001" });
    expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
    await expire(d.id);
    expect((await finalizeQuestionImportDraft(d.id, actor)).status).toBe(
      "completed"
    );
  });
  it("não sobrescreve edição legítima posterior, mesmo em outro lote com mesma chave", async () => {
    const a = await create();
    await finalizeQuestionImportDraft(a.id, actor);
    await db.exec(
      "update questoes set enunciado='Editado';update resolucoes set texto='Editado';"
    );
    const b = await create();
    expect(
      (await finalizeQuestionImportDraft(b.id, actor)).duplicatedCount
    ).toBe(1);
    expect(
      (await db.query<any>("select texto from resolucoes")).rows[0].texto
    ).toBe("Editado");
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 2 });
  });
  it("Storage retornando error deixa cancelamento confirmado e limpeza recuperável", async () => {
    const d = await create(1, true),
      u = await upload(d);
    state.storageError = true;
    const cancelled = await cancelQuestionImportDraft(d.id, actor);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cleanup_pending).toBe(true);
    expect(state.files.has(u.ticket.path)).toBe(true);
    state.storageError = false;
    await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.has(u.ticket.path)).toBe(false);
  });
  it("preserva imagem referenciada por questão/resolução após conclusão e limpeza", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await u.confirm();
    await finalizeQuestionImportDraft(d.id, actor);
    await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.has(u.ticket.path)).toBe(true);
    expect(state.removed).not.toContain(u.ticket.path);
    await expect(cancelQuestionImportDraft(d.id, actor)).rejects.toBeDefined();
  });
  it("troca segura preserva referência antiga até confirmação e retry não apaga a nova", async () => {
    const d = await create(1, true),
      a = await upload(d);
    await a.confirm();
    const b = await upload(await getQuestionImportDraft(d.id, actor));
    expect(state.files.has(a.ticket.path)).toBe(true);
    await b.confirm();
    expect(state.files.has(a.ticket.path)).toBe(false);
    await b.confirm();
    expect(
      (
        await discardQuestionImportReplacement(
          { ...b.identity, uploadPath: b.ticket.path },
          actor
        )
      ).removed
    ).toBe(false);
    expect(state.files.has(b.ticket.path)).toBe(true);
  });
  it("arquivo descartado não pode ser associado, inclusive via edição genérica", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await discardQuestionImportReplacement(
      { ...u.identity, uploadPath: u.ticket.path },
      actor
    );
    state.files.set(u.ticket.path, png());
    await expect(u.confirm()).rejects.toBeDefined();
    await expect(
      db.query("insert into questoes(enunciado,url_imagem) values('X',$1)", [
        `https://storage.test/questoes-imagens/${u.ticket.path}`,
      ])
    ).rejects.toMatchObject({ code: "55000" });
    await cancelQuestionImportDraft(d.id, actor);
    expect(state.files.has(u.ticket.path)).toBe(false);
  });
  it("outro editor e aluno são bloqueados na RPC", async () => {
    const d = await create();
    await expect(claim(d.id, "edit", randomUUID())).resolves.toBeDefined();
    await expect(
      sqlControl(d.id, "claim", randomUUID(), { kind: "edit" }, other)
    ).rejects.toMatchObject({ code: "P0002" });
    await db.query("update profiles set role='student' where id=$1", [other]);
    await expect(
      sqlControl(d.id, "claim", randomUUID(), { kind: "edit" }, other)
    ).rejects.toMatchObject({ code: "42501" });
    await db.query("update profiles set role='editor' where id=$1", [other]);
  });
  it("limpeza de expirados não assume lote finalizando", async () => {
    const d = await create();
    const c = await claim(d.id);
    await sqlControl(d.id, "start", c.operation_id);
    await db.transaction(async tx => {
      await tx.query("select set_config('vet.import_batch',$1,true)", [d.id]);
      await tx.query(
        "update question_import_batches set expires_at=now()-interval '1 day' where id=$1",
        [d.id]
      );
    });
    await cleanupExpiredQuestionImportDrafts(actor);
    expect((await getQuestionImportDraft(d.id, actor)).status).toBe(
      "finalizing"
    );
    expect(state.removed).toEqual([]);
  });
  it("compatibilidade da rota antiga usa a mesma sessão idempotente por usuário", async () => {
    const q = parseQuestionImportPayload(question()).questoes[0].item;
    const input = { batchId: "legacy-key", questions: [q] };
    const r = await importLegacyQuestionBatch(input, actor);
    expect(await importLegacyQuestionBatch(input, actor)).toEqual(r);
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("duas finalizações concorrentes da rota de serviço criam um único conjunto", async () => {
    const d = await create();
    const r = await Promise.allSettled([
      finalizeQuestionImportDraft(d.id, actor),
      finalizeQuestionImportDraft(d.id, actor),
    ]);
    expect(r.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("finalizar/cancelar simultâneos deixam apenas o resultado vencedor persistido", async () => {
    const d = await create();
    await Promise.allSettled([
      finalizeQuestionImportDraft(d.id, actor),
      cancelQuestionImportDraft(d.id, actor),
    ]);
    const saved = await getQuestionImportDraft(d.id, actor);
    expect(["completed", "cancelled"]).toContain(saved.status);
    expect((await counts()).questions).toBe(
      saved.status === "completed" ? 1 : 0
    );
  });
  it("dois lotes com a mesma questão não duplicam os blocos", async () => {
    const a = await create(),
      b = await create();
    await Promise.all([
      finalizeQuestionImportDraft(a.id, actor),
      finalizeQuestionImportDraft(b.id, actor),
    ]);
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 2 });
  });
  it.each(["missing", "invalid", "database"])(
    "confirmação com falha %s preserva a imagem antiga e permite retry",
    async kind => {
      const d = await create(1, true),
        a = await upload(d);
      await a.confirm();
      const b = await upload(await getQuestionImportDraft(d.id, actor));
      if (kind === "missing") state.files.delete(b.ticket.path);
      if (kind === "invalid") state.files.set(b.ticket.path, new Blob(["bad"]));
      if (kind === "database")
        await db.exec(
          "create function fail_slot() returns trigger language plpgsql as $$begin raise exception 'injected';end$$;create trigger fail_slot before update on question_import_image_slots for each row execute function fail_slot();"
        );
      try {
        await expect(b.confirm()).rejects.toBeDefined();
        expect(
          (await getQuestionImportDraft(d.id, actor)).slots[0].storage_path
        ).toBe(a.ticket.path);
        expect(state.files.has(a.ticket.path)).toBe(true);
      } finally {
        if (kind === "database")
          await db.exec(
            "drop trigger fail_slot on question_import_image_slots;drop function fail_slot();"
          );
      }
      state.files.set(b.ticket.path, png());
      await b.confirm();
      expect(
        (await getQuestionImportDraft(d.id, actor)).slots[0].storage_path
      ).toBe(b.ticket.path);
    }
  );
  it("troca concorrente rejeita previousPath desatualizado", async () => {
    const d = await create(1, true),
      a = await upload(d),
      b = await upload(d);
    await a.confirm();
    await expect(b.confirm()).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      (await getQuestionImportDraft(d.id, actor)).slots[0].storage_path
    ).toBe(a.ticket.path);
    expect(state.removed).not.toContain(a.ticket.path);
  });
  it("caminho de outro slot e lote de outro editor são rejeitados antes de apagar", async () => {
    const d = await create(1, true),
      u = await upload(d);
    await expect(
      prepareQuestionImportSlotUpload(
        {
          ...u.identity,
          byteSize: 30,
          contentType: "image/png",
          originalName: "f.png",
        },
        other
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      discardQuestionImportReplacement(
        {
          ...u.identity,
          uploadPath: u.ticket.path.replace(d.slots[0].id, other),
        },
        actor
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(state.removed).toEqual([]);
  });
  it("limpeza posterior falha sem transformar confirmação em falha", async () => {
    const d = await create(1, true),
      a = await upload(d);
    await a.confirm();
    const b = await upload(await getQuestionImportDraft(d.id, actor));
    state.storageError = true;
    await expect(b.confirm()).resolves.toBeDefined();
    expect(
      (await getQuestionImportDraft(d.id, actor)).slots[0].storage_path
    ).toBe(b.ticket.path);
    state.storageError = false;
    await cleanupQuestionImportDraft(d.id, actor);
    expect(state.files.has(b.ticket.path)).toBe(true);
  });
  it("imagem opcional ausente permite concluir e resolução com imagem é persistida", async () => {
    const q = question("optional", true);
    q.imagens[0].obrigatoria = false;
    const a = await createQuestionImportDraft(
      actor,
      JSON.stringify({ formato: "questoes-v2", questoes: [q] })
    );
    expect((await finalizeQuestionImportDraft(a.id, actor)).status).toBe(
      "completed"
    );
    const r = question("resolution", true);
    r.imagens[0].local = "resolucao";
    const b = await createQuestionImportDraft(
        actor,
        JSON.stringify({ formato: "questoes-v2", questoes: [r] })
      ),
      u = await upload(b);
    await u.confirm();
    await finalizeQuestionImportDraft(b.id, actor);
    expect(
      (
        await db.query<any>(
          "select url_imagem from resolucoes where tipo='imagem'"
        )
      ).rows[0].url_imagem
    ).toContain(u.ticket.path);
    await cleanupQuestionImportDraft(b.id, actor);
    expect(state.files.has(u.ticket.path)).toBe(true);
  });
  it("rascunho anterior sem journal reconhece questão já criada sem reparar conteúdo ambiguamente", async () => {
    const d = await create(),
      q = d.payload.questions[0];
    await db.transaction(async tx => {
      await tx.query("select set_config('vet.import_batch',$1,true)", [d.id]);
      await tx.query(
        "insert into questoes(import_source_id,import_batch_id,enunciado) values($1,$2,'Legada')",
        [q.id_importacao || q.import_hash, d.id]
      );
    });
    await expect(cancelQuestionImportDraft(d.id, actor)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    const result = await finalizeQuestionImportDraft(d.id, actor);
    expect(result.reviewRequiredCount).toBe(1);
    expect(await counts()).toEqual({ questions: 1, blocks: 0, items: 1 });
  });
  it("aceita JSON antigo sem imagens e JSONL pelo fluxo persistente", async () => {
    const q = {
      ...question("old"),
      chave_importacao: undefined,
      id_importacao: "old",
    };
    const a = await createQuestionImportDraft(actor, JSON.stringify(q));
    expect((await finalizeQuestionImportDraft(a.id, actor)).status).toBe(
      "completed"
    );
    const text = [
      { ...q, id_importacao: "line1" },
      { ...q, id_importacao: "line2" },
    ]
      .map(x => JSON.stringify(x))
      .join("\n");
    const b = await createQuestionImportDraft(actor, text);
    await finalizeQuestionImportDraft(b.id, actor);
    expect((await finalizeQuestionImportDraft(b.id, actor)).status).toBe(
      "completed"
    );
    expect(await counts()).toEqual({ questions: 3, blocks: 3, items: 3 });
  });
  it("backend anterior não pode editar slots nem concluir lote sem protocolo", async () => {
    await expect(
      db.query(
        "insert into questoes(enunciado,import_batch_id) values('Antiga','stateless-old-client')"
      )
    ).rejects.toMatchObject({ code: "55000" });
    const d = await create(1, true);
    await expect(
      db.query(
        "update question_import_batches set status='completed' where id=$1",
        [d.id]
      )
    ).rejects.toMatchObject({ code: "55000" });
    await expect(
      db.query(
        "update question_import_image_slots set status='ready' where batch_id=$1",
        [d.id]
      )
    ).rejects.toMatchObject({ code: "55000" });
  });
  it("RPCs de escrita não são concedidas a anon/authenticated", async () => {
    const rows = await db.query<any>(
      "select has_function_privilege('anon','vet_import_control(uuid,uuid,text,uuid,jsonb)','execute') anon,has_function_privilege('authenticated','vet_import_commit_item(uuid,uuid,uuid,text,jsonb,jsonb,integer)','execute') student,has_function_privilege('service_role','vet_import_control(uuid,uuid,text,uuid,jsonb)','execute') backend"
    );
    expect(rows.rows[0]).toEqual({
      anon: false,
      student: false,
      backend: true,
    });
  });
  it("resposta perdida da conclusão retorna exatamente o resultado persistido no retry", async () => {
    const d = await create();
    state.lostComplete = true;
    await expect(
      finalizeQuestionImportDraft(d.id, actor)
    ).rejects.toBeDefined();
    const saved = await getQuestionImportDraft(d.id, actor);
    expect(saved.status).toBe("completed");
    expect(await finalizeQuestionImportDraft(d.id, actor)).toEqual(
      saved.result
    );
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("falha no journal também reverte a questão antes de confirmar progresso", async () => {
    const d = await create();
    await db.exec(
      "create function fail_journal() returns trigger language plpgsql as $$begin raise exception 'injected';end$$;create trigger fail_journal before insert on question_import_items for each row execute function fail_journal();"
    );
    try {
      await expect(
        finalizeQuestionImportDraft(d.id, actor)
      ).rejects.toBeDefined();
      expect(await counts()).toEqual({ questions: 0, blocks: 0, items: 0 });
    } finally {
      await db.exec(
        "drop trigger fail_journal on question_import_items;drop function fail_journal();"
      );
    }
  });
  it("migration aditiva conserva rascunho e questão criados antes do protocolo", async () => {
    const id = randomUUID();
    const oldDb = await createImportDatabase(async local => {
      await local.query("insert into auth.users values($1)", [actor]);
      await local.query("insert into profiles values($1,'editor')", [actor]);
      await local.query(
        "insert into question_import_batches(id,created_by,format,payload,status) values($1,$2,'legacy',$3,'draft')",
        [id, actor, { questions: [], previews: [] }]
      );
      await local.query(
        "insert into questoes(import_batch_id,enunciado) values($1,'Preservada')",
        [id]
      );
    });
    try {
      const row = (
        await oldDb.query<any>(
          "select status,revision,operation_id from question_import_batches"
        )
      ).rows[0];
      expect(row).toMatchObject({
        status: "draft",
        revision: 0,
        operation_id: null,
      });
      expect(
        (await oldDb.query<any>("select enunciado from questoes")).rows[0]
          .enunciado
      ).toBe("Preservada");
    } finally {
      await oldDb.close();
    }
  }, 30000);
  it.each(["index", "midway"] as const)(
    "migration com falha %s não deixa DDL parcial",
    async failure => {
      let failedDb: PGlite | undefined;
      try {
        await expect(
          createImportDatabase(async local => {
            failedDb = local;
            if (failure === "index")
              await local.exec(
                "drop index questoes_import_source_id_unique_idx;create unique index questoes_import_source_id_unique_idx on questoes(codigo);"
              );
            else
              await local.exec(
                "create table question_import_assets(id uuid primary key);"
              );
          })
        ).rejects.toBeDefined();
        await failedDb!.exec("rollback;");
        expect(
          (
            await failedDb!.query<any>(
              "select count(*)::int n from information_schema.columns where table_schema='public' and table_name='question_import_batches' and column_name='operation_id'"
            )
          ).rows[0].n
        ).toBe(0);
        expect(
          (
            await failedDb!.query<any>(
              "select to_regclass('public.question_import_items') name"
            )
          ).rows[0].name
        ).toBeNull();
      } finally {
        await failedDb?.close();
      }
    },
    30000
  );
  it("rollback conserva journal e reapplication não duplica conteúdo", async () => {
    const d = await create();
    await finalizeQuestionImportDraft(d.id, actor);
    await db.exec(
      readFileSync(
        "supabase/rollbacks/202610200001_question_import_recovery.rollback.sql",
        "utf8"
      )
    );
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
    await db.exec(
      readFileSync(
        "supabase/migrations/202610200001_question_import_recovery.sql",
        "utf8"
      )
    );
    expect((await finalizeQuestionImportDraft(d.id, actor)).status).toBe(
      "completed"
    );
    expect(await counts()).toEqual({ questions: 1, blocks: 1, items: 1 });
  });
  it("descoberta preserva referência manual a arquivo legado ainda não registrado", async () => {
    const d = await create(1, true),
      path = `question-imports/${d.id}/${d.slots[0].id}/${randomUUID()}.png`;
    state.files.set(path, png());
    await db.query(
      "insert into questoes(enunciado,url_imagem) values('Legada',$1)",
      [`https://storage.test/questoes-imagens/${path}`]
    );
    await cancelQuestionImportDraft(d.id, actor);
    expect(state.files.has(path)).toBe(true);
    expect(
      (
        await db.query<any>(
          "select state from question_import_assets where storage_path=$1",
          [path]
        )
      ).rows[0].state
    ).toBe("retained");
  });
});
