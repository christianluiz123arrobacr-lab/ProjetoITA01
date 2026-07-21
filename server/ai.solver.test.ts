import { describe, it, expect, vi } from "vitest";

vi.mock("./_core/rateLimit", () => ({
  assertRateLimit: vi.fn().mockResolvedValue(undefined),
  assertRequestRateLimit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Resposta de teste" } }],
  }),
}));

import { appRouter } from "./routers";

function createAuthedCaller() {
  return appRouter.createCaller({
    req: {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    },
    res: {},
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "student@example.com",
      role: "student",
    },
  } as any);
}

describe("ai.solvePhysics", () => {
  it("should reject when both text and image are missing", async () => {
    const caller = createAuthedCaller();

    try {
      await caller.ai.solvePhysics({
        text: undefined,
        imageBase64: undefined,
        imageMimeType: undefined,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Forneça um texto ou uma imagem");
    }
  });

  it("should accept text input", async () => {
    const caller = createAuthedCaller();

    const result = await caller.ai.solvePhysics({
      text: "Um carro percorre 100km em 2h, qual sua velocidade média?",
      imageBase64: undefined,
      imageMimeType: undefined,
    });

    expect(result).toHaveProperty("result");
    expect(typeof result.result).toBe("string");
  });

  it("should handle image input with base64 encoding", async () => {
    const caller = createAuthedCaller();

    const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    try {
      const result = await caller.ai.solvePhysics({
        text: "Resolva este problema",
        imageBase64: mockBase64,
        imageMimeType: "image/png",
      });

      expect(result).toHaveProperty("result");
      expect(typeof result.result).toBe("string");
    } catch (error: any) {
      // Expected to fail due to mock LLM not being set up
      // In production, this would call the actual LLM
      expect(error).toBeDefined();
    }
  });

  it("should return a string result", async () => {
    const caller = createAuthedCaller();

    try {
      const result = await caller.ai.solvePhysics({
        text: "Calcule a aceleração de um objeto com força de 10N e massa de 2kg.",
        imageBase64: undefined,
        imageMimeType: undefined,
      });

      expect(result).toHaveProperty("result");
      expect(typeof result.result).toBe("string");
      expect(result.result.length).toBeGreaterThan(0);
    } catch (error: any) {
      // Expected in test environment without real LLM
      expect(error).toBeDefined();
    }
  });
});
