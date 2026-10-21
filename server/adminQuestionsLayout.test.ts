import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("client/src/pages/AdminQuestionsPage.tsx", "utf8");

describe("layout dos cards administrativos de questões", () => {
  it("mantém o conteúdo em largura integral quando as ações públicas aparecem", () => {
    expect(source).toContain('<div className="space-y-5">');
    expect(source).not.toContain("xl:flex-row xl:items-start xl:justify-between");
    expect(source).toContain("max-w-4xl text-base font-semibold leading-relaxed");
  });

  it("coloca as ações em uma área própria, responsiva e com quebra de linha", () => {
    expect(source).toContain("flex w-full flex-wrap items-center gap-3 border-t");
    expect(source).not.toContain('flex flex-wrap items-center gap-3 shrink-0');
  });

  it("usa o botão como link sem aninhar button dentro de anchor", () => {
    expect(source).toContain('<Button asChild variant="outline"');
    expect(source).toContain("Visualizar URL pública");
  });
});
