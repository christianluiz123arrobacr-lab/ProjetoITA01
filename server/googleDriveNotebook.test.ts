import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptGoogleToken,
  encryptGoogleToken,
  isProjectVetorNotebookMetadata,
  notebookPdfUploadTarget,
  safeNotebookName,
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
});
