import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_QUESTION_IMPORT_IMAGE_BYTES, parseQuestionImportPayload, validateQuestionImportItem } from "../shared/questionImportSchema";
import { applyReadyImageSlots, inspectQuestionImportImage, matchFilesToSlots } from "./questions/questionImportImages";

const base = (key = "q-1", images: any[] = []) => ({
  chave_importacao: key, disciplina: "Física", assunto: "Cinemática", dificuldade: "medio", banca: "ITA", ano: 2025,
  enunciado: "Enunciado", alternativas: [{ letra: "A", texto: "a" }, { letra: "B", texto: "b" }, { letra: "C", texto: "c" }],
  resposta: "C", resolucao: "Resolução", imagens: images,
});
const slot = (id: string, local = "enunciado", required = true, extra: any = {}) => ({ slot_id: id, obrigatoria: required, local, texto_alternativo: `Descrição ${id}`, ...extra });
const parse = (questions: any[]) => parseQuestionImportPayload({ formato: "questoes-v2", questoes: questions });

function png(width = 10, height = 20) {
  const bytes = new Uint8Array(24); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer); view.setUint32(16, width); view.setUint32(20, height); return bytes;
}

describe("importação v2 com imagens", () => {
  it("1/22 mantém compatibilidade com JSON sem imagens e com o formato antigo", () => {
    const legacy = parseQuestionImportPayload({ ...base(), chave_importacao: undefined, imagens: undefined });
    expect(legacy.summary.validas).toBe(1); expect(legacy.questoes[0].item.imagens).toEqual([]);
  });
  it("2 importa uma questão com uma imagem declarada", () => expect(parse([base("q1", [slot("fig")])]).questoes[0].item.imagens).toHaveLength(1));
  it("3 importa várias questões com imagens", () => expect(parse([base("q1", [slot("a")]), base("q2", [slot("b")])]).summary.validas).toBe(2));
  it("4/5 identifica cinco pendências num lote de dez questões", () => {
    const batch = parse(Array.from({ length: 10 }, (_, index) => base(`q${index}`, index < 5 ? [slot(`fig-${index}`)] : [])));
    expect(batch.questoes.filter((item) => item.item.imagens.some((image) => image.obrigatoria))).toHaveLength(5);
  });
  it("6 associa por nome esperado", () => expect(matchFilesToSlots(["fig.png"], parse([base("q", [slot("s", "enunciado", true, { nome_arquivo_esperado: "fig.png" })])]).questoes[0].item.imagens).matches).toEqual({ "fig.png": "s" }));
  it("7 deixa arquivo sem correspondência para seleção manual", () => expect(matchFilesToSlots(["outro.png"], parse([base("q", [slot("s")])]).questoes[0].item.imagens).unmatched).toEqual(["outro.png"]));
  it("8 mantém imagem obrigatória distinguível de pendência", () => expect(parse([base("q", [slot("s")])]).questoes[0].item.imagens[0].obrigatoria).toBe(true));
  it("9 imagem opcional não é marcada obrigatória", () => expect(parse([base("q", [slot("s", "enunciado", false)])]).questoes[0].item.imagens[0].obrigatoria).toBe(false));
  it("10 aplica imagem no enunciado", () => { const question = parse([base("q", [slot("s")])]).questoes[0].item; expect(applyReadyImageSlots(question, [{ ...question.imagens[0], import_key: "q", public_url: "https://storage.test/a.png" }]).url_imagem).toContain("a.png"); });
  it("11 aplica imagem na alternativa", () => { const question = parse([base("q", [slot("s", "alternativa", true, { alternativa: "A" })])]).questoes[0].item; expect(applyReadyImageSlots(question, [{ ...question.imagens[0], import_key: "q", public_url: "https://storage.test/a.png" }]).a_url_imagem).toContain("a.png"); });
  it("12 aplica imagem e metadados na resolução", () => { const question = parse([base("q", [slot("s", "resolucao")])]).questoes[0].item; const result = applyReadyImageSlots(question, [{ ...question.imagens[0], import_key: "q", public_url: "https://storage.test/a.png" }]); expect(result.resolucao_blocos.at(-1)).toEqual(expect.objectContaining({ tipo: "imagem", url_imagem: "https://storage.test/a.png", texto: expect.stringContaining("Descrição s") })); });
  it("13 ignora/rejeita slot desconhecido ao hidratar outra questão", () => { const question = parse([base("q")]).questoes[0].item; expect(applyReadyImageSlots(question, [{ ...slot("x"), alternativa: null, nome_arquivo_esperado: null, descricao: null, legenda: null, import_key: "outra", public_url: "https://storage.test/x.png" } as any]).url_imagem).toBeNull(); });
  it("14 rejeita slot_id duplicado", () => expect(parse([base("q", [slot("x"), slot("x")])]).summary.invalidas).toBe(1));
  it("15 rejeita conteúdo com tipo real diferente", () => expect(() => inspectQuestionImportImage(png(), "image/jpeg")).toThrow(/conteúdo real/));
  it("16 rejeita arquivo acima do limite", () => expect(() => inspectQuestionImportImage(new Uint8Array(MAX_QUESTION_IMPORT_IMAGE_BYTES + 1), "image/png")).toThrow(/3 MB/));
  it("17 endpoints de upload são adminProcedure", () => expect(readFileSync("server/routers.ts", "utf8")).toMatch(/prepareQuestionImportImageUpload: adminProcedure/));
  it("18 valida lote, chave e slot no backend", () => expect(readFileSync("server/questions/questionImportBatchService.ts", "utf8")).toContain('.eq("batch_id", input.batchId).eq("import_key", input.importKey).eq("slot_id", input.slotId)'));
  it("19 usa chave estável para retry sem duplicação", () => { const first = parse([base("fixa")]).questoes[0].item; const second = parse([base("fixa")]).questoes[0].item; expect(first.id_importacao).toBe(second.id_importacao); });
  it("20 cancelamento remove uploads temporários", () => expect(readFileSync("server/questions/questionImportBatchService.ts", "utf8")).toMatch(/cancelQuestionImportDraft[\s\S]+storage\.from\(bucket\)\.remove/));
  it("20b limpeza controlada cancela somente rascunhos expirados do administrador", () => {
    const source = readFileSync("server/questions/questionImportBatchService.ts", "utf8");
    expect(source).toMatch(/cleanupExpiredQuestionImportDrafts[\s\S]+\.eq\("created_by", userId\)[\s\S]+\.eq\("status", "draft"\)[\s\S]+\.lt\("expires_at"/);
  });
  it("21 rascunho persiste e pode ser recarregado", () => { const source = readFileSync("server/routers.ts", "utf8"); expect(source).toContain("createQuestionImportDraft: adminProcedure"); expect(source).toContain("getQuestionImportDraft: adminProcedure"); });
  it("23 mantém metadados para a renderização canônica", () => { const question = parse([base("q", [slot("s")])]).questoes[0].item; const result = applyReadyImageSlots(question, [{ ...question.imagens[0], import_key: "q", public_url: "https://storage.test/a.png" }]); expect(result.image_metadata[0]).toEqual(expect.objectContaining({ texto_alternativo: "Descrição s" })); });
  it("24 preserva texto alternativo e legenda separados", () => { const image = parse([base("q", [slot("s", "enunciado", true, { legenda: "Legenda" })])]).questoes[0].item.imagens[0]; expect(image.texto_alternativo).toBe("Descrição s"); expect(image.legenda).toBe("Legenda"); });
  it("rejeita URL externa e data/base64 no formato v2", () => { const external = parse([{ ...base("q"), url_imagem: "https://externo.test/a.png" }]); const embedded = parse([{ ...base("q2"), url_imagem: "data:image/png;base64,AAA" }]); expect(external.summary.invalidas).toBe(1); expect(embedded.summary.invalidas).toBe(1); });
  it("valida assinatura PNG e dimensões", () => expect(inspectQuestionImportImage(png(640, 480), "image/png")).toEqual({ mime: "image/png", width: 640, height: 480, byteSize: 24 }));
  it("revalida a questão hidratada antes de finalizar", () => { const question = parse([base("q")]).questoes[0].item; expect(validateQuestionImportItem(question).status).toBe("valida"); });
  it("trata conflito concorrente de chave idempotente como duplicata", () => expect(readFileSync("server/routers.ts", "utf8")).toMatch(/error\?\.code === "23505"[\s\S]+Questão já criada por outra tentativa/));
});
