import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { buildPublicAnswer, buildPublicSlugBase, chooseUniquePublicSlug, isPubliclyEligible, isValidPublicSlug, PUBLIC_SITE_ORIGIN, toInitialPublicQuestion } from "./publicQuestions";
import { buildPublicQuestionHtml, buildNotFoundHtml } from "./publicQuestionPage";
import { buildSitemapXml } from "../api/sitemap";
import { parsePublicAnswerInput } from "../api/public-question/answer";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "00000000-0000-4000-8000-000000000001", codigo: "Q01345", disciplina: "Matemática", conteudo: "Inequações",
  banca: "EsPCEx", instituição: "EsPCEx", ano: 2025, dificuldade: "Médio", enunciado: "Resolva $x > 2$.",
  A: "x > 1", B: "x > 2", C: "x > 3", D: "x > 4", E: "x > 5", alternativa_correta: "b",
  public_slug: "espc-ex-2025-matematica-inequacoes-q01345", is_public: true, public_noindex: false, publicada: true,
  ...overrides,
});

describe("páginas públicas de questões", () => {
  it("aceita apenas slug canônico rigoroso", () => {
    expect(isValidPublicSlug(row().public_slug)).toBe(true);
    expect(isValidPublicSlug("../admin")).toBe(false);
    expect(isValidPublicSlug("Slug Com Espaço")).toBe(false);
  });

  it("considera pública apenas questão ativa, publicada e indexável", () => {
    expect(isPubliclyEligible(row())).toBe(true);
    expect(isPubliclyEligible(row({ is_public: false }))).toBe(false);
    expect(isPubliclyEligible(row({ publicada: false }))).toBe(false);
    expect(isPubliclyEligible(row({ public_noindex: true }))).toBe(false);
  });

  it("DTO inicial não expõe UUID, gabarito nem resolução", () => {
    const dto = toInitialPublicQuestion(row());
    expect(dto.statement).toContain("Resolva");
    expect(JSON.stringify(dto)).not.toContain(row().id);
    expect(JSON.stringify(dto)).not.toContain("alternativa_correta");
    expect(JSON.stringify(dto)).not.toContain("resolution");
  });

  it("evita colisão de slug no backend", async () => {
    const first = buildPublicSlugBase(row(), "q01345");
    const exists = vi.fn(async (slug: string) => slug === first);
    const unique = await chooseUniquePublicSlug(row(), exists);
    expect(unique).not.toBe(first);
    expect(isValidPublicSlug(unique)).toBe(true);
  });

  it("gera SEO SSR canônico sem resposta correta", () => {
    const html = buildPublicQuestionHtml(toInitialPublicQuestion(row()));
    expect(html).toContain(`<link rel="canonical" href="${PUBLIC_SITE_ORIGIN}/questoes/${row().public_slug}">`);
    expect(html).toContain('<meta name="robots" content="index,follow">');
    expect(html).toContain('application/ld+json');
    expect(html).not.toContain("alternativa_correta");
    expect(html).not.toContain("Ver resolução");
    expect(html).toContain("Conferir resposta");
    expect(html).toContain('href="/banco-de-questoes"');
    expect(html).not.toContain('href="/plataforma/banco-questoes"');
    expect(buildNotFoundHtml()).toContain("noindex,nofollow");
  });

  it("sitemap contém somente origem canônica e entradas recebidas do filtro seguro", () => {
    const xml = buildSitemapXml([{ slug: row().public_slug, lastmod: "2026-08-12T10:00:00Z" }]);
    expect(xml).toContain(`${PUBLIC_SITE_ORIGIN}/questoes/${row().public_slug}`);
    expect(xml).not.toMatch(/\/admin|\/plataforma|\/api\//);
    expect(xml).not.toContain("/login");
    expect(xml).not.toContain("/cadastro");
    expect(xml.match(/https:\/\/www\.projetovetor\.com/g)?.length).toBe(3);
  });

  it("calcula a correção no backend e só então entrega gabarito e resolução", () => {
    expect(parsePublicAnswerInput({ slug: row().public_slug })).toBeNull();
    expect(parsePublicAnswerInput({ slug: row().public_slug, reveal: true })).toBeNull();
    expect(parsePublicAnswerInput({ slug: row().public_slug, selectedOption: "a", isCorrect: true, correctOption: "a" })).toEqual({
      slug: row().public_slug,
      selectedOption: "a",
    });
    const result = buildPublicAnswer("b", "a", [{ tipo: "texto", texto: "Resolução revisada", ordem: 1 }]);
    expect(result).toEqual({
      isCorrect: false,
      correctOption: "b",
      resolution: [{ type: "texto", text: "Resolução revisada", imageUrl: null, order: 1 }],
    });
  });

  it("mantém persistência separada e explícita, com cálculo no backend", () => {
    const service = readFileSync("server/publicQuestions.ts", "utf8");
    const page = readFileSync("server/publicQuestionPage.ts", "utf8");
    const router = readFileSync("server/routers.ts", "utf8");
    expect(page).toContain("register.addEventListener('click'");
    expect(page).not.toContain("record_canonical_question_attempt");
    expect(service).toContain('row.alternativa_correta');
    expect(service).toContain('p_question_id: row.id');
    expect(service).not.toContain("input.isCorrect");
    expect(readFileSync("api/public-question/answer.ts", "utf8")).not.toContain("reveal");
    expect(router).toContain("setPublicQuestionPublication: adminProcedure");
  });

  it("mantém rotas críticas existentes e restringe publicação a admin", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    const router = readFileSync("server/routers.ts", "utf8");
    for (const route of ["/login", "/cadastro", "/admin", "/plataforma"]) expect(app).toContain(route);
    expect(router).toContain("setPublicQuestionPublication: adminProcedure");
    expect(router).toContain("recordAttempt: protectedProcedure");
  });
});
