import { describe, expect, it, vi } from "vitest";
import { createPublicQuestionPageHandler } from "../api/public-question/[slug]";

function responseMock() {
  const headers = new Map<string, string>();
  return {
    statusCode: 200,
    body: "",
    setHeader(name: string, value: string) { headers.set(name, value); },
    end(value?: string) { this.body = value || ""; },
    headers,
  };
}

const request = {
  method: "GET",
  url: "/questoes/espc-ex-2025-matematica-inequacoes-q01345",
  query: { slug: "espc-ex-2025-matematica-inequacoes-q01345" },
  headers: {},
};

describe("GET da página pública", () => {
  it("responde 404 e noindex quando a questão não existe", async () => {
    const handler = createPublicQuestionPageHandler(async () => null);
    const response = responseMock();
    await handler(request as any, response as any);
    expect(response.statusCode).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.body).toContain("Conteúdo não disponível");
  });

  it("responde 500 sem detalhes internos em falha inesperada", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = createPublicQuestionPageHandler(async () => { throw new Error("database secret detail"); });
    const response = responseMock();
    await handler(request as any, response as any);
    expect(response.statusCode).toBe(500);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    expect(response.body).toContain("Tente novamente em instantes");
    expect(response.body).not.toContain("database secret detail");
    log.mockRestore();
  });
});
