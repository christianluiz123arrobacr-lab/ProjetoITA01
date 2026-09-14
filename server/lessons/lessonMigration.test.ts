import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../supabase/migrations/202609140001_lesson_engine_mvp.sql", import.meta.url), "utf8");

describe("lesson publication database invariants", () => {
  it("creates immutable numbered publication snapshots", () => {
    expect(sql).toContain("unique (lesson_id, version_number)");
    expect(sql).toContain("before update or delete on public.lesson_versions");
    expect(sql).toContain("select coalesce(max(lv.version_number), 0) + 1");
  });
  it("lets students read only the current published snapshot", () => {
    expect(sql).toContain('create policy "lesson_versions_read_current_published"');
    expect(sql).toContain("l.current_published_version_id = lesson_versions.id");
    expect(sql).not.toMatch(/lesson_drafts[^;]+for select to authenticated(?![\s\S]*public\.is_admin\(\))/);
  });
  it("keeps publish and restore behind backend-only functions", () => {
    expect(sql).toContain("revoke all on function public.lesson_publish");
    expect(sql).toContain("grant execute on function public.lesson_publish");
    expect(sql).toContain("to service_role");
    expect(sql).toContain("revoke insert, update, delete on public.lessons");
  });
  it("restores a snapshot into the draft without deleting history", () => {
    expect(sql).toContain("create or replace function public.lesson_restore_draft");
    expect(sql).toContain("restored_from_version_id = excluded.restored_from_version_id");
    expect(sql).not.toContain("delete from public.lesson_versions");
  });
  it("seeds the pilot as a draft without publishing it", () => {
    expect(sql).toContain("bases-da-cinematica-experimental");
    expect(sql).toContain("insert into public.lesson_drafts");
    expect(sql).not.toMatch(/current_published_version_id[^;]*bases-da-cinematica-experimental/);
  });
});
