import { describe, expect, it } from "vitest";
import { hasUnsavedLessonChanges } from "../../client/src/hooks/useUnsavedLessonChanges.js";

describe("unsaved lesson draft protection", () => {
  it("warns only after a saved snapshot exists and content changed", () => {
    expect(hasUnsavedLessonChanges("", "novo")).toBe(false);
    expect(hasUnsavedLessonChanges("igual", "igual")).toBe(false);
    expect(hasUnsavedLessonChanges("salvo", "alterado")).toBe(true);
  });
});
