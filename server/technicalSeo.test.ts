import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const sitemapHandler = readFileSync(new URL("../api/sitemap.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");

describe("SEO técnico público", () => {
  it("usa o domínio canônico oficial nos metadados", () => {
    expect(indexHtml).toContain("<title>Projeto Vetor | Plataforma de Estudos</title>");
    expect(indexHtml).toContain('<link rel="canonical" href="https://www.projetovetor.com/" />');
    expect(indexHtml).toContain('<meta property="og:url" content="https://www.projetovetor.com/" />');
    expect(indexHtml).not.toMatch(/noindex/i);
  });

  it("gera sitemap dinâmico com páginas institucionais e questões elegíveis", () => {
    expect(sitemapHandler).toContain('["/", "/planos"]');
    expect(sitemapHandler).not.toContain('"/login"');
    expect(sitemapHandler).not.toContain('"/cadastro"');
    expect(sitemapHandler).toContain("listPublicSitemapEntries");
    expect(sitemapHandler).toContain('application/xml; charset=utf-8');
    expect(sitemapHandler).not.toMatch(/\/(?:admin|administracao|plataforma|caderno|escrever|perfil|assinaturas)/);
  });

  it("permite páginas públicas e protege rotas privadas no robots", () => {
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap: https://www.projetovetor.com/sitemap.xml");
    expect(robots).not.toContain("Disallow: /planos");
    expect(robots).not.toContain("Disallow: /login");
    expect(robots).not.toContain("Disallow: /cadastro");
  });
});
