import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/pages/AdminQuestionCreatePage.tsx", import.meta.url),
  "utf8"
);

function count(pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

describe("integridade do editor de criação de questões", () => {
  it("é um TSX sintaticamente válido com um único componente default", () => {
    const sourceFile = ts.createSourceFile(
      "AdminQuestionCreatePage.tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    expect(sourceFile.parseDiagnostics).toEqual([]);
    expect(count(/export default function/g)).toBe(1);
    expect(count(/async function handleCreate\(/g)).toBe(1);
  });

  it("mantém somente a implementação TRPC atual da resolução importada", () => {
    expect(count(/const saveResolutionBlocksMutation\s*=/g)).toBe(1);
    expect(count(/saveResolutionBlocksMutation\.mutateAsync\(/g)).toBe(1);
    expect(count(/const \[resolutionDraftBlocks,/g)).toBe(1);
    expect(source).not.toContain("saveImportedResolutionBlocks");
    expect(source).not.toContain("pendingResolutionBlocks");
  });

  it("salva a questão, depois os blocos, conclui a mensagem e só então navega", () => {
    const createQuestion = source.indexOf(
      "createQuestionMutation.mutateAsync({ payload })"
    );
    const saveBlocks = source.indexOf(
      "saveResolutionBlocksMutation.mutateAsync({",
      createQuestion
    );
    const successMessage = source.indexOf("setSuccessMessage(", saveBlocks);
    const successMessageEnd = source.indexOf("\n      );", successMessage);
    const navigation = source.indexOf(
      "setLocation(`/admin/resolucoes/${data.id}`)",
      successMessage
    );

    expect(createQuestion).toBeGreaterThan(-1);
    expect(saveBlocks).toBeGreaterThan(createQuestion);
    expect(successMessage).toBeGreaterThan(saveBlocks);
    expect(successMessageEnd).toBeGreaterThan(successMessage);
    expect(navigation).toBeGreaterThan(successMessageEnd);
    expect(source.slice(successMessage, successMessageEnd)).toContain(
      "getQuestionCreationSuccessMessage(resolutionDraftBlocks.length)"
    );
  });

  it("preserva o fluxo de importação JSON e a limpeza dos blocos em rascunho", () => {
    expect(source).toContain("const importedResolutionBlocks = readResolutionBlocks(");
    expect(source).toContain("setResolutionDraftBlocks(importedResolutionBlocks)");
    expect(source).toContain("setResolutionDraftBlocks([])");
    expect(source).toContain(
      "Questão e resolução criadas com sucesso. Indo para a resolução..."
    );
    expect(source).toContain("Questão criada com sucesso. Indo para a resolução...");
  });
});
