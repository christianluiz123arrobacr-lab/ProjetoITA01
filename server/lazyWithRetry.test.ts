import { describe, expect, it, vi } from "vitest";
import {
  DynamicImportRecoveryError,
  getDynamicImportRecoveryAction,
  importWithRetry,
  isDynamicImportError,
  type DynamicImportEnvironment,
} from "../client/src/lib/lazyWithRetry";

function createEnvironment(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const reload = vi.fn();
  const environment: DynamicImportEnvironment = {
    sessionStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    },
    reload,
  };
  return { environment, reload, values };
}

const staleChunkError = new TypeError(
  "Failed to fetch dynamically imported module: /assets/old.js"
);

describe("recuperação de imports dinâmicos", () => {
  it.each([
    "Failed to fetch dynamically imported module",
    "Importing a module script failed",
    "error loading dynamically imported module",
    "Loading chunk failed",
  ])("reconhece erro de chunk: %s", message =>
    expect(isDynamicImportError(new Error(message))).toBe(true)
  );

  it("solicita reload somente na primeira falha de chunk", async () => {
    const { environment, reload, values } = createEnvironment();
    void importWithRetry(
      "QuestionBankPage",
      () => Promise.reject(staleChunkError),
      environment
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(values.get("projeto-vetor:chunk-retry:QuestionBankPage")).toBe("1");
  });

  it("não cria loop e produz erro amigável na segunda falha", async () => {
    const { environment, reload } = createEnvironment({
      "projeto-vetor:chunk-retry:QuestionBankPage": "1",
    });
    await expect(
      importWithRetry(
        "QuestionBankPage",
        () => Promise.reject(staleChunkError),
        environment
      )
    ).rejects.toBeInstanceOf(DynamicImportRecoveryError);
    expect(reload).not.toHaveBeenCalled();
    expect(getDynamicImportRecoveryAction(staleChunkError, true)).toBe(
      "show-friendly-error"
    );
  });

  it("não recarrega para erro comum de programação", async () => {
    const programmingError = new TypeError("Cannot read properties of null");
    const { environment, reload } = createEnvironment();
    await expect(
      importWithRetry(
        "FunctionSimulatorPage",
        () => Promise.reject(programmingError),
        environment
      )
    ).rejects.toBe(programmingError);
    expect(reload).not.toHaveBeenCalled();
    expect(getDynamicImportRecoveryAction(programmingError, false)).toBe(
      "rethrow"
    );
  });

  it("limpa a trava depois que o módulo carrega com sucesso", async () => {
    const { environment, values } = createEnvironment({
      "projeto-vetor:chunk-retry:Page": "1",
    });
    const component = () => null;
    await expect(
      importWithRetry(
        "Page",
        () => Promise.resolve({ default: component }),
        environment
      )
    ).resolves.toEqual({ default: component });
    expect(values.has("projeto-vetor:chunk-retry:Page")).toBe(false);
  });
});
