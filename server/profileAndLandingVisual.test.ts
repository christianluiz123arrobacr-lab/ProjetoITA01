import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const landing = readFileSync(new URL("../client/src/pages/LandingPage.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../client/src/pages/ProfilePage.tsx", import.meta.url), "utf8");

describe("ajustes visuais de perfil e plataforma", () => {
  it("mantém os três cards de disciplinas com altura e rodapé estáveis", () => {
    expect(landing.match(/vetor-surface flex h-full flex-col/g)).toHaveLength(3);
    expect(landing.match(/mt-auto shrink-0 p-6/g)).toHaveLength(3);
    expect(landing.match(/min-h-56 flex-1 flex-col/g)).toHaveLength(3);
  });

  it("define superfícies e textos escuros para os cards semânticos do perfil", () => {
    for (const tone of ["emerald", "red", "blue", "orange", "teal", "rose", "indigo", "yellow"]) {
      expect(profile).toContain(`dark:bg-${tone}-950`);
      expect(profile).toContain(`dark:border-${tone}-800`);
    }
    expect(profile).toContain("dark:bg-purple-950");
    expect(profile).toContain("dark:text-indigo-100");
    expect(profile).toContain("Leitura estratégica");
    expect(profile).toContain("Histórico pessoal");
  });
});
