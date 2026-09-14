import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UnsafeLessonRenderer } from "../../client/src/components/lessons/LessonRenderer.js";

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
