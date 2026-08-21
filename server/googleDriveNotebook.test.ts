import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptGoogleToken,
  DRIVE_SCOPES,
  editableNotebookMetadata,
  encryptGoogleToken,
  isProjectVetorNotebookMetadata,
  notebookListUrl,
  notebookPdfUploadTarget,
  safeNotebookName,
  visibleNotebookPdfMetadata,
} from "./googleDrive/googleDriveService";
import {
  NOTEBOOK_AUTOSAVE_MS,
  paperDimensions,
  shouldAutosave,
  validateNotebookName,
} from "../client/src/lib/notebookDocument";

const originalKey = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
beforeEach(() => {
  process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
    "base64"
  );
});
afterEach(() => {
  if (originalKey === undefined)
    delete process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  else process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = originalKey;
});

describe("segurança do Caderno no Google Drive", () => {
  it("criptografa refresh token com AES-GCM e recupera somente com a chave do backend", () => {
    const encrypted = encryptGoogleToken("refresh-secret");
    expect(encrypted).not.toContain("refresh-secret");
    expect(decryptGoogleToken(encrypted)).toBe("refresh-secret");
    process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(
      32,
      8
    ).toString("base64");
    expect(() => decryptGoogleToken(encrypted)).toThrow();
  });
  it("rejeita arquivo sem propriedades do Projeto Vetor", () => {
    expect(
      isProjectVetorNotebookMetadata({
        mimeType: "text/plain",
        appProperties: {},
      })
    ).toBe(false);
    expect(
      isProjectVetorNotebookMetadata({
        mimeType: "application/json",
        appProperties: {
          projetoVetorType: "notebook",
          projetoVetorVersion: "1",
        },
      })
    ).toBe(true);
    expect(
      isProjectVetorNotebookMetadata({
        mimeType: "application/vnd.projeto-vetor.notebook+json",
        trashed: true,
        appProperties: {
          projetoVetorType: "notebook",
          projetoVetorVersion: "1",
        },
      })
    ).toBe(false);
  });
  it("cria o PDF uma vez e atualiza o mesmo ID nas exportações seguintes", () => {
    expect(notebookPdfUploadTarget()).toMatchObject({ method: "POST" });
    const update = notebookPdfUploadTarget("pdf_file_12345");
    expect(update.method).toBe("PATCH");
    expect(update.path).toContain("/pdf_file_12345?uploadType=multipart");
  });
  it("mantém o editável no appDataFolder e o PDF na pasta visível", () => {
    const editable = editableNotebookMetadata("Mecânica", { size: "a4", lined: true });
    expect(editable.parents).toEqual(["appDataFolder"]);
    expect(editable.appProperties.storageSpace).toBe("appDataFolder");
    expect(notebookListUrl("appDataFolder", "query", "files(id)")).toContain("spaces=appDataFolder");

    const pdf = visibleNotebookPdfMetadata("Mecânica", "visible-folder", "editable-id", false);
    expect(pdf.parents).toEqual(["visible-folder"]);
    expect(pdf.appProperties.sourceNotebookId).toBe("editable-id");
    expect(visibleNotebookPdfMetadata("Mecânica", "visible-folder", "editable-id", true)).not.toHaveProperty("parents");
  });
  it("solicita os dois escopos mínimos e marca conexões antigas para reconexão", () => {
    expect(DRIVE_SCOPES).toEqual([
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.appdata",
    ]);
    const migration = readFileSync("supabase/migrations/202608160001_google_drive_appdata_scope.sql", "utf8");
    expect(migration).toContain("appdata_enabled_at");
    expect(migration).not.toMatch(/json|strokes|pages/i);
  });
  it("normaliza nome válido e rejeita nome perigoso", () => {
    expect(safeNotebookName("  Dinâmica   — exercícios ")).toBe(
      "Dinâmica — exercícios"
    );
    expect(() => safeNotebookName("../../segredo")).toThrow();
    expect(validateNotebookName("").valid).toBe(false);
    expect(validateNotebookName("Lista: 1").valid).toBe(false);
  });
});

describe("configuração e autosave do editor", () => {
  const editorSource = readFileSync(
    new URL("../client/src/pages/NotebookEditorPage.tsx", import.meta.url),
    "utf8"
  );
  const workspaceSource = readFileSync(
    new URL(
      "../client/src/components/study-canvas/StudyCanvasWorkspace.tsx",
      import.meta.url
    ),
    "utf8"
  );

  it.each(["a5", "a4", "a3", "infinite"] as const)(
    "oferece %s com ou sem linhas sem transformar fundo em traços",
    size => {
      const dimensions = paperDimensions(size);
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(dimensions.width);
      const document = { paper: { size, lined: true }, elements: [] };
      expect(document.elements).toHaveLength(0);
      expect({ ...document, paper: { size, lined: false } }.elements).toBe(
        document.elements
      );
    }
  );
  it("salva após dois minutos somente quando alterado", () => {
    expect(NOTEBOOK_AUTOSAVE_MS).toBe(120_000);
    expect(shouldAutosave(true, 0, 119_999)).toBe(false);
    expect(shouldAutosave(true, 0, 120_000)).toBe(true);
    expect(shouldAutosave(false, 0, 240_000)).toBe(false);
  });
  it("serializa gravações e consome cada pedido manual uma única vez", () => {
    expect(editorSource).toContain("saveQueueRef.current.catch");
    expect(editorSource).toContain("saveQueueRef.current = save.catch");
    expect(workspaceSource).toContain(
      "saveRequest <= processedSaveRequestRef.current"
    );
  });
  it("não trata a persistência do Drive como sessão anônima", () => {
    expect(workspaceSource).toContain("!userId && !persistence");
  });
  it("sincroniza o relógio do caderno depois de vincular o PDF", () => {
    expect(editorSource).toContain(
      "modifiedTimeRef.current = result.notebookModifiedTime"
    );
  });
  it("migra legados sem apagá-los e troca o editor para o ID privado", () => {
    const service = readFileSync(new URL("./googleDrive/googleDriveService.ts", import.meta.url), "utf8");
    expect(service).toContain("migrateLegacyNotebook");
    expect(service).toContain("legacySourceFileId");
    expect(service).toContain("migratedEditableFileId");
    const migrationFlow = service.slice(service.indexOf("async function migrateLegacyNotebook"), service.indexOf("export function notebookPdfUploadTarget"));
    expect(migrationFlow).not.toContain("trashed: true");
    expect(editorSource).toContain("activeDocumentIdRef.current = result.id");
    expect(editorSource).toContain("replace: true");
  });
  it("gera PDF somente por ação explícita e explica a separação ao aluno", () => {
    expect(editorSource).toContain("Seu caderno continua editável no Projeto Vetor. O PDF será salvo no seu Google Drive.");
    expect(editorSource).toContain("onClick={() => void savePdfToDrive()}");
    expect(editorSource).not.toMatch(/autosave[\s\S]{0,300}exportPdf\.mutate/i);
  });
});
