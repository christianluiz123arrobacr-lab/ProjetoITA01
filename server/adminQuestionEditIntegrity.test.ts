import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const questionEditorPath = new URL(
  "../client/src/pages/AdminQuestionEditPage.tsx",
  import.meta.url
);
const resolutionEditorPath = new URL(
  "../client/src/pages/AdminResolutionEditorPage.tsx",
  import.meta.url
);
const questionEditor = readFileSync(questionEditorPath, "utf8");
const resolutionEditor = readFileSync(resolutionEditorPath, "utf8");

function parseDiagnostics(source: string, fileName: string) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  return sourceFile.parseDiagnostics;
}

describe("integridade do editor administrativo de questões", () => {
  it("permanece um TSX sintaticamente válido com exatamente um export default", () => {
    expect(parseDiagnostics(questionEditor, "AdminQuestionEditPage.tsx")).toEqual([]);
    expect(questionEditor.match(/export default function/g) ?? []).toHaveLength(1);
    expect(questionEditor).toContain("export default function AdminQuestionEditPage()");
  });

  it("mantém o formulário fechado antes das constantes e componentes seguintes", () => {
    const initialFormStart = questionEditor.indexOf(
      "const initialForm: QuestionFormData = {"
    );
    const initialFormEnd = questionEditor.indexOf("\n};", initialFormStart);
    const firstComponent = questionEditor.indexOf("function FieldLabel", initialFormStart);

    expect(initialFormStart).toBeGreaterThan(-1);
    expect(initialFormEnd).toBeGreaterThan(initialFormStart);
    expect(firstComponent).toBeGreaterThan(initialFormEnd);
    expect(questionEditor).toContain(
      'const QUESTION_IMAGES_BUCKET = "questoes-imagens";'
    );
  });

  it("não contém estruturas pertencentes ao editor de resolução", () => {
    expect(questionEditor).not.toContain("AdminResolutionEditorPage");
    expect(questionEditor).not.toContain("type ResolutionBlock");
    expect(questionEditor).not.toContain("type EditableBlock");
    expect(questionEditor).not.toContain('STORAGE_BUCKET = "resolucoes-imagens"');
    expect(questionEditor).not.toContain("AUTORES_RESOLUCAO");
  });

  it("preserva carregamento, salvamento e uploads seguros do editor de questões", () => {
    expect(questionEditor).toContain("trpcUtils.admin.getQuestionById.fetch(");
    expect(questionEditor).toContain("trpc.admin.updateQuestion.useMutation()");
    expect(questionEditor).toContain(
      "trpc.admin.createAdminImageUpload.useMutation()"
    );
    expect(questionEditor).toContain("uploadToSignedStorageUrl({");
    expect(questionEditor).toContain("handleAlternativeImageUpload(");
    expect(questionEditor).toContain("accept=\"image/png,image/jpeg,image/webp\"");
  });

  it("mantém o código de resolução somente no arquivo correto", () => {
    expect(parseDiagnostics(resolutionEditor, "AdminResolutionEditorPage.tsx")).toEqual(
      []
    );
    expect(resolutionEditor.match(/export default function/g) ?? []).toHaveLength(1);
    expect(resolutionEditor).toContain(
      "export default function AdminResolutionEditorPage()"
    );
    expect(resolutionEditor).toContain("type ResolutionBlock");
    expect(resolutionEditor).toContain("type EditableBlock");
    expect(resolutionEditor).toContain('const STORAGE_BUCKET = "resolucoes-imagens";');
  });
});
