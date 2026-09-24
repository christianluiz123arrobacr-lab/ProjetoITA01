import { describe, expect, it } from "vitest";
import { latexToSearchText, renderSearchableMath } from "./publicQuestionMath";

describe("matemática pesquisável das questões públicas", () => {
  it("converte frações e operadores frequentes em texto acessível", () => {
    expect(latexToSearchText("$\\frac{5}{7}$")).toBe("5 sobre 7");
    expect(latexToSearchText("$\\frac{x+1}{2}$")).toBe("x mais 1 sobre 2");
    expect(latexToSearchText("$x^2$")).toBe("x elevado a 2");
    expect(latexToSearchText("$\\sqrt{9}$")).toBe("raiz quadrada de 9");
    expect(latexToSearchText("$a \\times b$")).toBe("a vezes b");
    expect(latexToSearchText("$x \\leq 3$")).toBe("x menor ou igual a 3");
  });

  it("preserva o LaTeX para MathJax e adiciona texto presente no HTML inicial", () => {
    const html = renderSearchableMath("Calcule $\\frac{5}{7}$ agora.");
    expect(html).toContain("$\\frac{5}{7}$");
    expect(html).toContain('aria-label="5 sobre 7"');
    expect(html).toContain('<span class="sr-only">(5 sobre 7)</span>');
  });

  it("escapa texto comum, LaTeX e resultado acessível", () => {
    const html = renderSearchableMath('<script>alert(1)</script> $x^{<img>}$');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("reconhece delimitadores inline e de bloco", () => {
    for (const source of ["$x^2$", "$$x^2$$", "\\(x^2\\)", "\\[x^2\\]"]) {
      expect(renderSearchableMath(source)).toContain("elevado a 2");
    }
  });
});
