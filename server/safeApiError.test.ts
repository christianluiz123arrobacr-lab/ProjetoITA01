import { describe, expect, it } from "vitest";
import { getSafeApiErrorMessage } from "../client/src/lib/safeApiError";

describe("safe API errors", () => {
  const fallback = "Serviço temporariamente indisponível.";

  it.each([
    "Unexpected token 'A', \"A server e\"... is not valid JSON",
    "A server error has occurred",
    "Internal Server Error",
  ])("does not expose a non-JSON server response: %s", message => {
    expect(getSafeApiErrorMessage(new Error(message), fallback)).toBe(fallback);
  });

  it("preserves a safe business message", () => {
    expect(getSafeApiErrorMessage(new Error("Pagamento ainda pendente."), fallback))
      .toBe("Pagamento ainda pendente.");
  });
});
