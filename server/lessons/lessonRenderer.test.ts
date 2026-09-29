import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonRenderer, UnsafeLessonRenderer } from "../../client/src/components/lessons/LessonRenderer.js";

describe("LessonRenderer protected fallback", () => {
  it("renders a safe fallback instead of failing the full lesson", () => {
    const element = React.createElement(UnsafeLessonRenderer, {
      mode: "preview",
      lesson: { blocks: [
        { id: "ok", type: "text", visible: true, content: "Conteúdo preservado" },
        { id: "future", type: "diagram", visible: true, payload: {} },
      ] },
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Conteúdo preservado");
    expect(html).toContain("Tipo de bloco desconhecido");
  });
});

it("renders v1 and v2 through the same renderer with responsive grids and accessible derivations", () => {
  const lesson = { schemaVersion: 2 as const, blocks: [{ id: "secao", type: "section" as const, visible: true, title: "Cinemática", anchor: "cinematica", blocks: [{ id: "grid", type: "grid" as const, visible: true, preset: "one_third_two_thirds" as const, columns: [{ id: "coluna-a", blocks: [{ id: "formula", type: "formula_card" as const, visible: true, latex: "v=\\frac{s}{t}", terms: [{ symbol: "v", meaning: "velocidade", unit: "m/s" }], observations: [], validityConditions: ["Tempo não nulo."], variant: "primary" as const }] }, { id: "coluna-b", blocks: [{ id: "demonstracao", type: "derivation" as const, visible: true, title: "Demonstração", initiallyOpen: false, steps: [{ id: "passo", text: "Partimos da definição." }] }] }] }] }] };
  const html = renderToStaticMarkup(React.createElement(LessonRenderer, { lesson }));
  expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]");
  expect(html).toContain("Condições de validade");
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain("Demonstração");
});
