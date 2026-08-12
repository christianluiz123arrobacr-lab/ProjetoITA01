import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../client/public/sitemap.xml", import.meta.url), "utf8");
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");

describe("SEO técnico público", () => {
  it("usa o domínio canônico oficial nos metadados", () => {
    expect(indexHtml).toContain("<title>Projeto Vetor | Plataforma de Estudos</title>");
    expect(indexHtml).toContain('<link rel="canonical" href="https://www.projetovetor.com/" />');
    expect(indexHtml).toContain('<meta property="og:url" content="https://www.projetovetor.com/" />');
    expect(indexHtml).not.toMatch(/noindex/i);
  });

  it("inclui somente as quatro rotas públicas no sitemap", () => {
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    expect(locations).toEqual([
      "https://www.projetovetor.com/",
      "https://www.projetovetor.com/planos",
      "https://www.projetovetor.com/login",
      "https://www.projetovetor.com/cadastro",
    ]);
    expect(sitemap).not.toMatch(/\/(?:admin|administracao|plataforma|caderno|escrever|perfil|assinaturas)(?:<|\/)/);
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
