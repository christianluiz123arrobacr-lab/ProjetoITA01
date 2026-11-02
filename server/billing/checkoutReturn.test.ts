import { describe, expect, it } from "vitest";
import { checkoutReturn } from "../../client/src/lib/checkoutReturn";

describe("checkout authentication destination", () => {
  it("preserves plan and coupon through authentication", () => {
    expect(
      checkoutReturn(
        "?returnTo=" + encodeURIComponent("/planos?cupom=VETOR&plano=basic"),
        "/plataforma"
      )
    ).toBe("/planos?cupom=VETOR&plano=basic");
  });
  it.each([
    "https://evil.example/planos",
    "//evil.example/planos",
    "/admin",
    "javascript:alert(1)",
    "/planos/../admin",
  ])("rejects unsafe destination %s", target => {
    expect(
      checkoutReturn("?returnTo=" + encodeURIComponent(target), "/plataforma")
    ).toBe("/plataforma");
  });
  it("preserves ordinary login destination", () =>
    expect(checkoutReturn("", "/plataforma")).toBe("/plataforma"));
});
