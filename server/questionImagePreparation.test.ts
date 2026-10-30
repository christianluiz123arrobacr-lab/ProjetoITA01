import { describe, it, expect, vi } from "vitest";
import {
  createQuestionImagePreparer,
  imageHasAnimation,
  IMAGE_TARGET_BYTES,
} from "../client/src/lib/questionImagePreparation";
import { inspectQuestionImportImage } from "../shared/questionImageInspection";
import { matchFilesToSlots } from "./questions/questionImportImages";
function png(size = 600_000, width = 400, height = 300) {
  const bytes = new Uint8Array(size);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const v = new DataView(bytes.buffer);
  v.setUint32(16, width);
  v.setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = 6;
  return bytes;
}
const file = (bytes = png(), name = "diagrama.png", type = "image/png") =>
  new File([bytes], name, { type });
const webp = (size = 200_000) => {
  const b = new Uint8Array(size);
  b.set(Array.from("RIFF").map(c => c.charCodeAt(0)));
  b.set(
    Array.from("WEBPVP8X").map(c => c.charCodeAt(0)),
    8
  );
  b[24] = 143;
  b[25] = 1;
  b[27] = 43;
  b[28] = 1;
  return b;
};
describe("preparação de novas imagens (bytes sintéticos; não validação visual)", () => {
  it("preserva pequena sem chamar encoder", async () => {
    const encode = vi.fn();
    const f = file(png(300));
    const r = await createQuestionImagePreparer(encode)(f);
    expect(r.file).toBe(f);
    expect(encode).not.toHaveBeenCalled();
  });
  it("PNG sem perdas pode ficar acima da meta; original disponível; retry usa o mesmo File", async () => {
    const encode = vi
      .fn()
      .mockResolvedValue(new Blob([png(450_000)], { type: "image/png" }));
    const prepare = createQuestionImagePreparer(encode),
      original = file();
    const r = await prepare(original);
    expect(r.changed).toBe(true);
    expect(r.file.size).toBeGreaterThan(IMAGE_TARGET_BYTES);
    expect(r.original).toBe(original);
    expect((await prepare(original)).file).toBe(r.file);
    expect(encode).toHaveBeenCalledTimes(1);
  });
  it("não retorna arquivo maior ou economia marginal", async () => {
    const original = file();
    for (const n of [590_000, 700_000, 3_200_000])
      expect(
        (
          await createQuestionImagePreparer(
            async () => new Blob([png(n)], { type: "image/png" })
          )(original)
        ).file
      ).toBe(original);
  });
  it("WebP só é usado quando MIME e bytes são WebP, com nome correspondente", async () => {
    const r = await createQuestionImagePreparer(
      async () => new Blob([webp()], { type: "image/webp" })
    )(file(), "photo");
    expect(r.file.name).toBe("diagrama.webp");
    expect(r.file.type).toBe("image/webp");
    expect(
      inspectQuestionImportImage(
        new Uint8Array(await r.file.arrayBuffer()),
        r.file.type
      ).mime
    ).toBe("image/webp");
    expect(
      (
        await createQuestionImagePreparer(
          async () => new Blob([png(200_000)], { type: "image/png" })
        )(file(), "photo")
      ).changed
    ).toBe(false);
    expect(
      (
        await createQuestionImagePreparer(
          async () => new Blob([png(200_000)], { type: "image/webp" })
        )(file(), "photo")
      ).changed
    ).toBe(false);
  });
  it("não altera dimensões nem animação ou PNG com profundidade especial", async () => {
    const encode = vi.fn();
    const animated = png();
    new DataView(animated.buffer).setUint32(8, 0);
    animated.set(
      Array.from("acTL").map(c => c.charCodeAt(0)),
      12
    );
    expect(imageHasAnimation(animated, "image/png")).toBe(true);
    await createQuestionImagePreparer(encode)(file(animated));
    const high = png();
    high[24] = 16;
    await createQuestionImagePreparer(encode)(file(high));
    await createQuestionImagePreparer(encode)(file(png(600_000, 12000, 12000)));
    expect(encode).not.toHaveBeenCalled();
    const r = await createQuestionImagePreparer(
      async () => new Blob([png(100_000, 200, 150)], { type: "image/png" })
    )(file());
    expect(r.changed).toBe(false);
  });
  it("bloqueia excesso de bytes antes de ler/decodificar e rejeita MIME/extensão falsa", async () => {
    const large = file(png(3 * 1024 * 1024 + 1)),
      spy = vi.spyOn(large, "arrayBuffer");
    await expect(createQuestionImagePreparer(vi.fn())(large)).rejects.toThrow(
      /3 MiB/
    );
    expect(spy).not.toHaveBeenCalled();
    await expect(
      createQuestionImagePreparer(vi.fn())(file(png(), "x.jpg"))
    ).rejects.toThrow(/Extensão/);
    await expect(
      createQuestionImagePreparer(vi.fn())(file(new Uint8Array(100)))
    ).rejects.toThrow(/conteúdo real/);
  });
  it("cancelamento não fornece saída nem deixa resultado abortado no cache", async () => {
    const controller = new AbortController(),
      encode = vi.fn(async () => {
        controller.abort();
        return new Blob([png(100_000)], { type: "image/png" });
      }),
      prepare = createQuestionImagePreparer(encode),
      f = file();
    await expect(
      prepare(f, "document", controller.signal)
    ).rejects.toMatchObject({ name: "AbortError" });
    encode.mockResolvedValue(new Blob([png(100_000)], { type: "image/png" }));
    expect((await prepare(f)).changed).toBe(true);
    expect(encode).toHaveBeenCalledTimes(2);
  });
  it("sem worker/encoder confiável, mantém o original", async () => {
    const f = file();
    expect((await createQuestionImagePreparer(async () => null)(f)).file).toBe(
      f
    );
  });
  it("associa pelo nome original antes de converter PNG em WebP", async () => {
    const original = file();
    const slots = [
      { slot_id: "figura-A", nome_arquivo_esperado: "diagrama.png" },
    ] as Parameters<typeof matchFilesToSlots>[1];
    const matched = matchFilesToSlots([original.name], slots);
    const prepared = await createQuestionImagePreparer(
      async () => new Blob([webp()], { type: "image/webp" })
    )(original, "photo");
    expect(prepared.file.name).toBe("diagrama.webp");
    expect(matched.matches[original.name]).toBe("figura-A");
    expect(matched.ambiguous).toEqual([]);
  });
  it("WebP animado mantém os quadros no arquivo original", async () => {
    const b = webp(600_000);
    b[20] = 2;
    const original = file(b, "animation.webp", "image/webp"),
      encode = vi.fn();
    expect(imageHasAnimation(b, "image/webp")).toBe(true);
    expect(
      (await createQuestionImagePreparer(encode)(original, "photo")).file
    ).toBe(original);
    expect(encode).not.toHaveBeenCalled();
  });
});
