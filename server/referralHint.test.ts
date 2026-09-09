import { afterEach, describe, expect, it, vi } from "vitest";
import { getReferralHint } from "../client/src/lib/referralHint";

afterEach(() => vi.unstubAllGlobals());

describe("referral hint", () => {
  it("aceita um código válido quando o aplicativo de mensagens inclui pontuação no fim do link", () => {
    const values = new Map<string, string>();
    vi.stubGlobal("window", {
      location: { search: "?ref=d696ba6e79f0539d1ec9efb7d81fa34b." },
    });
    vi.stubGlobal("sessionStorage", {
      setItem: (key: string, value: string) => values.set(key, value),
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    });

    expect(getReferralHint()).toBe("d696ba6e79f0539d1ec9efb7d81fa34b");
  });
});
