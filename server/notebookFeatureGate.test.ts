import { describe, expect, it } from "vitest";
import { NOTEBOOK_DEVELOPMENT_MESSAGE, NOTEBOOK_FEATURE_AVAILABLE } from "../shared/featureAvailability";

describe("bloqueio de lançamento do Caderno", () => {
  it("libera o recurso quando aprovado para acesso", () => {
    expect(NOTEBOOK_FEATURE_AVAILABLE).toBe(true);
    expect(NOTEBOOK_DEVELOPMENT_MESSAGE).toContain("em desenvolvimento");
  });
});
