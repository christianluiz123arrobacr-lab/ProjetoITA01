import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("recuperação de recursos na exportação PDF", () => {
  it.each(["network", "http", "invalid font"])("identifica falha %s e permite tentar novamente", async failure => {
    const font = readFileSync(new URL("../client/public/fonts/pdf/DejaVuSans.ttf", import.meta.url));
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => {
        if (failure === "network") throw new Error("Detalhes internos da conexão");
        return failure === "http" ? new Response("not found", { status: 404 }) : new Response("<html>Fallback da SPA</html>");
      })
      .mockResolvedValueOnce(new Response(font));
    vi.stubGlobal("fetch", fetchMock);
    const { loadPdfUnicodeFont } = await import("../client/src/lib/questionPdfUnicodeFont");
    const { QuestionPdfError } = await import("../client/src/lib/questionPdfErrors");
    const error = await loadPdfUnicodeFont().catch(error => error);
    expect(error).toBeInstanceOf(QuestionPdfError);
    expect(error.userMessage).toContain("Verifique sua conexão e tente novamente");
    expect(error.userMessage).not.toContain("Detalhes internos");
    expect((await loadPdfUnicodeFont()).glyph("⁴").id).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
