import { describe, expect, it } from "vitest";
import { NOTEBOOK_DEVELOPMENT_MESSAGE, NOTEBOOK_FEATURE_AVAILABLE } from "../shared/featureAvailability";

describe("bloqueio de lançamento do Caderno", () => {
  it("mantém o recurso indisponível enquanto está em desenvolvimento", () => {
    expect(NOTEBOOK_FEATURE_AVAILABLE).toBe(false);
    expect(NOTEBOOK_DEVELOPMENT_MESSAGE).toContain("em desenvolvimento");
  });
});
