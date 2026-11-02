import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const auth = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("./_core/supabaseAdmin.js", () => ({
  supabaseAdmin: {
    auth: { getUser: auth.getUser },
    rpc: (...args: unknown[]) => ({ abortSignal: () => auth.rpc(...args) }),
  },
}));
import { createContext } from "./_core/context";
import { appRouter } from "./routers";

let db: PGlite;
const actor = "10000000-0000-4000-8000-000000000001";
const target = "10000000-0000-4000-8000-000000000002";
const accessId = "20000000-0000-4000-8000-000000000002";
const migration = readFileSync(
  "supabase/migrations/202610190001_stage_one_privacy_authorization.sql",
  "utf8"
);
const rollback = readFileSync(
  "supabase/rollbacks/202610190001_stage_one_privacy_authorization.rollback.sql",
  "utf8"
);
const revoke = (id = accessId, user: string | null = target, caller = actor) =>
  db.query(
    "select public.vet_revoke_admin_access($1::uuid,$2::uuid,$3::uuid) result",
    [caller, id, user]
  );
const role = async (id: string) =>
  (
    await db.query<{ result: { role: string } }>(
      "select public.vet_resolve_access_role($1::uuid) result",
      [id]
    )
  ).rows[0].result.role;

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table public.profiles(id uuid primary key, role text, ativo boolean default true);
    create table public.admin_users(id uuid primary key,user_id uuid unique,role text);
    create table public.content_pages(id uuid primary key,is_published boolean);
    create table public.content_blocks(id uuid primary key,page_id uuid,type text,content text,order_index integer,is_visible boolean,internal_note text);
  `);
  const resolver = readFileSync(
    "supabase/migrations/202610150001_browse_and_role_snapshot.sql",
    "utf8"
  ).match(/create function public\.vet_resolve_access_role[\s\S]*?\$\$;/)![0];
  await db.exec(resolver);
  await db.exec(migration);
}, 30000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(`delete from public.admin_users; delete from public.profiles; delete from public.content_blocks; delete from public.content_pages;
    insert into public.profiles(id,role) values('${actor}','student'),('${target}','student');
    insert into public.admin_users(id,user_id,role) values('${actor}','${actor}','admin');`);
  auth.rpc.mockImplementation(async (name, args) => ({
    data: (
      await db.query<{ result: unknown }>(
        name === "vet_public_content_blocks"
          ? "select vet_public_content_blocks($1::uuid) result"
          : "select vet_resolve_access_role($1::uuid) result",
        [args.p_page_id ?? args.p_user]
      )
    ).rows[0].result,
    error: null,
  }));
});

describe("revogação em PostgreSQL local sintético, nunca Supabase remoto", () => {
  it.each(["entry", "legacy", "both", "editor"])(
    "revoga representação %s sem permitir fallback administrativo",
    async representation => {
      if (representation !== "legacy")
        await db.exec(
          `insert into public.admin_users values('${accessId}','${target}','${representation === "editor" ? "editor" : "admin"}')`
        );
      if (representation === "legacy" || representation === "both")
        await db.exec(
          `update public.profiles set role='admin' where id='${target}'`
        );
      expect(await role(target)).toBe(
        representation === "editor" ? "editor" : "admin"
      );
      await revoke(
        representation === "legacy" ? target : accessId,
        representation === "legacy" ? null : target
      );
      expect(await role(target)).toBe("student");
      expect(
        (
          await db.query("select * from public.admin_users where user_id=$1", [
            target,
          ])
        ).rows
      ).toEqual([]);
    }
  );
  it("limpa também profiles.role editor para não reabrir exceção de acesso", async () => {
    await db.exec(
      `update public.profiles set role='editor' where id='${target}'; insert into public.admin_users values('${accessId}','${target}','editor');`
    );
    await revoke();
    expect(
      (
        await db.query<{ role: string }>(
          "select role from profiles where id=$1",
          [target]
        )
      ).rows[0].role
    ).toBe("student");
  });
  it("não remove o último administrador nem transforma a conta de aluno", async () => {
    await expect(revoke(actor, actor)).rejects.toThrow("LAST_ADMIN");
    expect(await role(actor)).toBe("admin");
    await expect(revoke()).rejects.toThrow("ACCESS_NOT_FOUND");
    expect(await role(target)).toBe("student");
  });
  it("último administrador legado também é protegido", async () => {
    await db.exec(
      `delete from admin_users; update profiles set role='admin' where id='${actor}';`
    );
    await expect(revoke(actor, actor)).rejects.toThrow("LAST_ADMIN");
  });
  it("considera admin_users editor como precedência sobre perfil legado admin", async () => {
    await db.exec(
      `insert into admin_users values('${accessId}','${target}','editor'); update profiles set role='admin' where id='${target}';`
    );
    await expect(revoke(actor, actor)).rejects.toThrow("LAST_ADMIN");
    await revoke();
    expect(await role(target)).toBe("student");
  });
  it("falha após DELETE reverte ambas as representações", async () => {
    await db.exec(`insert into admin_users values('${accessId}','${target}','admin'); update profiles set role='admin' where id='${target}';
      create function public.reject_role_update() returns trigger language plpgsql as $$ begin raise exception 'SIMULATED_WRITE_FAILURE'; end $$;
      create trigger fail_role before update on profiles for each row execute function public.reject_role_update();`);
    try {
      await expect(revoke()).rejects.toThrow("SIMULATED_WRITE_FAILURE");
      expect(await role(target)).toBe("admin");
      expect(
        (await db.query("select * from admin_users where id=$1", [accessId]))
          .rows
      ).toHaveLength(1);
      expect(
        (
          await db.query<{ role: string }>(
            "select role from profiles where id=$1",
            [target]
          )
        ).rows[0].role
      ).toBe("admin");
    } finally {
      await db.exec(
        "drop trigger fail_role on profiles; drop function reject_role_update();"
      );
    }
  });
  it("verifica o ator no banco e rejeita alvo incompatível", async () => {
    await db.exec(
      `insert into admin_users values('${accessId}','${target}','editor');`
    );
    await expect(revoke(accessId, target, target)).rejects.toThrow(
      "ADMIN_REQUIRED"
    );
    await expect(revoke(accessId, actor)).rejects.toThrow(
      "ACCESS_TARGET_MISMATCH"
    );
    expect(await role(target)).toBe("editor");
  });
  it("RPC é executável somente por service_role, não navegador", async () => {
    for (const name of ["anon", "authenticated", "service_role"]) {
      const result = await db.query<{ allowed: boolean }>(
        "select has_function_privilege($1,'public.vet_revoke_admin_access(uuid,uuid,uuid)','execute') allowed",
        [name]
      );
      expect(result.rows[0].allowed).toBe(name === "service_role");
      const blocks = await db.query<{ allowed: boolean }>(
        "select has_function_privilege($1,'public.vet_public_content_blocks(uuid)','execute') allowed",
        [name]
      );
      expect(blocks.rows[0].allowed).toBe(name === "service_role");
    }
  });
  it.each([true, false, null])(
    "handler público com PostgreSQL local: publicação %s",
    async published => {
      if (published !== null)
        await db.query("insert into content_pages values($1,$2)", [
          target,
          published,
        ]);
      await db.query(
        "insert into content_blocks values($1,$2,'text_block','Primeiro',1,true,'PRIVATE'),($3,$2,'text_block','Segundo',2,true,'PRIVATE'),($4,$2,'text_block','Oculto',0,false,'PRIVATE')",
        [actor, target, target, accessId]
      );
      const api = appRouter.createCaller({
        req: { headers: {} },
        res: {},
        user: null,
      } as any);
      const result = await api.contentPages.getBlocksByPageId({
        pageId: target,
      });
      expect(result.map(row => row.content)).toEqual(
        published === true ? ["Primeiro", "Segundo"] : []
      );
      expect(JSON.stringify(result)).not.toMatch(
        /internal_note|PRIVATE|Oculto/
      );
    }
  );
  it("próxima requisição administrativa resolve papel novamente e nega o revogado", async () => {
    await db.exec(
      `insert into admin_users values('${accessId}','${target}','admin'); update profiles set role='admin' where id='${target}';`
    );
    auth.getUser.mockResolvedValue({
      data: { user: { id: target } },
      error: null,
    });
    auth.rpc.mockImplementation(async (_name, args) => ({
      data: (
        await db.query<{ result: unknown }>(
          "select vet_resolve_access_role($1::uuid) result",
          [args.p_user]
        )
      ).rows[0].result,
      error: null,
    }));
    const options = {
      req: { headers: { authorization: "Bearer synthetic" } },
      res: {},
    } as any;
    expect((await createContext(options)).user?.role).toBe("admin");
    await revoke();
    const ctx = await createContext(options);
    expect(ctx.user?.role).toBe("student");
    await expect(
      appRouter.createCaller(ctx).admin.getDashboardStats()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rollback e reaplicação não restauram nem modificam papéis", async () => {
    const before = (await db.query("select * from profiles order by id")).rows;
    await db.exec(rollback);
    await db.exec(migration);
    expect((await db.query("select * from profiles order by id")).rows).toEqual(
      before
    );
  });
});
